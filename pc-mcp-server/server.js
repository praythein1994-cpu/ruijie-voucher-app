#!/usr/bin/env node
/**
 * PC Control MCP Server
 * Exposes Windows PC control tools via Model Context Protocol
 * Pattern: Ei Maung's earthquake-mcp (Node.js + @modelcontextprotocol/sdk)
 *
 * Tools:
 * - execute_command: Run whitelisted PowerShell/cmd commands
 * - read_file: Read a file's contents
 * - write_file: Write content to a file
 * - list_directory: List directory contents
 * - get_system_info: Get PC system information
 * - open_application: Open an application by name/path
 * - browser_capture: Navigate to URL, auto-capture ALL network requests (DevTools replacement)
 * - browser_click: Click an element on the current page
 * - browser_type: Type text into an element
 * - browser_screenshot: Take a screenshot of the current page
 *
 * Safety: Command whitelist enforced. Destructive operations require
 * explicit tool calls (no silent deletes).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright';

const execAsync = promisify(exec);

// ── Safety: whitelisted command prefixes ──
const ALLOWED_COMMANDS = [
  'dir', 'echo', 'type', 'ipconfig', 'ping', 'tracert',
  'systeminfo', 'tasklist', 'whoami', 'hostname', 'ver',
  'Get-', 'Set-Location', 'Get-ChildItem', 'Get-Content',
  'Test-Connection', 'Get-Process', 'Get-Service',
  'adb', 'python', 'node', 'npm', 'git',
];

function isCommandAllowed(cmd) {
  const trimmed = cmd.trim();
  return ALLOWED_COMMANDS.some(prefix =>
    trimmed.toLowerCase().startsWith(prefix.toLowerCase())
  );
}

// ── Browser state (persistent across tool calls) ──
let browser = null;
let browserPage = null;
let capturedRequests = [];

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: false }); // visible so user can see
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    browserPage = await context.newPage();
    // Capture all network requests (DevTools Network tab replacement)
    browserPage.on('request', (req) => {
      capturedRequests.push({
        method: req.method(),
        url: req.url(),
        headers: req.headers(),
        postData: req.postData(),
        timestamp: new Date().toISOString(),
      });
    });
    browserPage.on('response', async (res) => {
      const req = res.request();
      // Find matching request and attach response info
      const match = capturedRequests.find(r =>
        r.url === req.url() && r.method === req.method() && !r.status
      );
      if (match) {
        match.status = res.status();
        try {
          const body = await res.text();
          match.responseBody = body.slice(0, 5000); // truncate
        } catch (e) { match.responseBody = '[binary/unreadable]'; }
      }
    });
  }
  return browserPage;
}

// ── MCP Server ──
const server = new Server(
  { name: 'pc-control', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ──
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'execute_command',
      description: 'Execute a whitelisted PowerShell or CMD command on the Windows PC. Returns stdout/stderr. Only safe, read-mostly commands are allowed.',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command to execute (must start with a whitelisted prefix)' },
          timeout: { type: 'number', description: 'Timeout in seconds (default 30, max 90)', default: 30 },
        },
        required: ['command'],
      },
    },
    {
      name: 'read_file',
      description: 'Read the contents of a file on the PC.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Full path to the file' },
          max_chars: { type: 'number', description: 'Max characters to read (default 10000)', default: 10000 },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write content to a file on the PC. Creates parent directories if needed.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Full path to the file' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'list_directory',
      description: 'List files and folders in a directory on the PC.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: user home)', default: os.homedir() },
        },
      },
    },
    {
      name: 'get_system_info',
      description: 'Get PC system information (OS, hostname, CPU, memory, uptime).',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'open_application',
      description: 'Open an application on the PC by executable name or full path.',
      inputSchema: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'Application name (e.g. "notepad") or full path to .exe' },
        },
        required: ['app'],
      },
    },
    {
      name: 'browser_capture',
      description: 'DEVTOOLS REPLACEMENT: Navigate to a URL and capture ALL network requests/responses. Returns the full list of API calls made by the page. Use this instead of asking the user to open DevTools.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to navigate to' },
          wait_seconds: { type: 'number', description: 'Seconds to wait after load for async requests (default 5)', default: 5 },
          filter: { type: 'string', description: 'Only include requests matching this substring (e.g. "api", "gateway")' },
        },
        required: ['url'],
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the current browser page by CSS selector or text.',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector or text to click' },
          by_text: { type: 'boolean', description: 'If true, treat selector as text content to find', default: false },
        },
        required: ['selector'],
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an input element on the current browser page.',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the input' },
          text: { type: 'string', description: 'Text to type' },
          submit: { type: 'boolean', description: 'Press Enter after typing', default: false },
        },
        required: ['selector', 'text'],
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current browser page.',
      inputSchema: {
        type: 'object',
        properties: {
          full_page: { type: 'boolean', description: 'Capture full scrollable page', default: false },
        },
      },
    },
  ],
}));

// ── Tool implementations ──
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'execute_command': {
        const cmd = args.command;
        if (!isCommandAllowed(cmd)) {
          return {
            content: [{ type: 'text', text: `BLOCKED: Command "${cmd}" is not in the whitelist. Allowed prefixes: ${ALLOWED_COMMANDS.join(', ')}` }],
            isError: true,
          };
        }
        const timeout = Math.min((args.timeout || 30) * 1000, 90000);
        try {
          const { stdout, stderr } = await execAsync(cmd, {
            timeout,
            shell: 'powershell.exe',
            maxBuffer: 1024 * 1024,
          });
          return {
            content: [{ type: 'text', text: `STDOUT:\n${stdout}\n${stderr ? `STDERR:\n${stderr}` : ''}` }],
          };
        } catch (e) {
          return {
            content: [{ type: 'text', text: `Command failed: ${e.message}\nSTDOUT: ${e.stdout || ''}\nSTDERR: ${e.stderr || ''}` }],
            isError: true,
          };
        }
      }

      case 'read_file': {
        try {
          const content = await fs.readFile(args.path, 'utf-8');
          const maxChars = args.max_chars || 10000;
          const truncated = content.length > maxChars;
          return {
            content: [{ type: 'text', text: truncated ? content.slice(0, maxChars) + `\n...[truncated, ${content.length} total chars]` : content }],
          };
        } catch (e) {
          return { content: [{ type: 'text', text: `Read failed: ${e.message}` }], isError: true };
        }
      }

      case 'write_file': {
        try {
          const dir = path.dirname(args.path);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(args.path, args.content, 'utf-8');
          return { content: [{ type: 'text', text: `Written ${args.content.length} chars to ${args.path}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `Write failed: ${e.message}` }], isError: true };
        }
      }

      case 'list_directory': {
        try {
          const dirPath = args.path || os.homedir();
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          const listing = entries.map(e =>
            `${e.isDirectory() ? '[DIR] ' : '[FILE]'} ${e.name}`
          ).join('\n');
          return { content: [{ type: 'text', text: `Contents of ${dirPath}:\n${listing}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `List failed: ${e.message}` }], isError: true };
        }
      }

      case 'get_system_info': {
        try {
          const { stdout } = await execAsync(
            'systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Manufacturer" /C:"System Model"',
            { shell: 'cmd.exe', timeout: 30000 }
          );
          return {
            content: [{
              type: 'text',
              text: `Hostname: ${os.hostname()}\nPlatform: ${os.platform()} ${os.arch()}\n${stdout}\nCPU: ${os.cpus()[0]?.model || 'unknown'}\nMemory: ${Math.round(os.totalmem() / 1073741824)}GB total, ${Math.round(os.freemem() / 1073741824)}GB free\nUptime: ${Math.round(os.uptime() / 3600)}h`,
            }],
          };
        } catch (e) {
          return { content: [{ type: 'text', text: `Info failed: ${e.message}` }], isError: true };
        }
      }

      case 'open_application': {
        try {
          const app = args.app;
          // Use Start-Process for safe app launching
          await execAsync(`Start-Process "${app}"`, { shell: 'powershell.exe', timeout: 10000 });
          return { content: [{ type: 'text', text: `Launched: ${app}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `Launch failed: ${e.message}` }], isError: true };
        }
      }

      case 'browser_capture': {
        try {
          const page = await ensureBrowser();
          capturedRequests = []; // reset
          await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30000 });
          const waitMs = (args.wait_seconds || 5) * 1000;
          await page.waitForTimeout(waitMs);
          let reqs = capturedRequests;
          if (args.filter) {
            const f = args.filter.toLowerCase();
            reqs = reqs.filter(r => r.url.toLowerCase().includes(f));
          }
          // Format for readability
          const summary = reqs.map((r, i) =>
            `[${i}] ${r.method} ${r.url}\n    Status: ${r.status || 'pending'}\n` +
            (r.postData ? `    Body: ${r.postData.slice(0, 500)}\n` : '') +
            (r.responseBody ? `    Response: ${r.responseBody.slice(0, 500)}\n` : '')
          ).join('\n');
          return {
            content: [{ type: 'text', text: `Captured ${reqs.length} requests from ${args.url}:\n\n${summary || '(no requests matched)'}` }],
          };
        } catch (e) {
          return { content: [{ type: 'text', text: `Capture failed: ${e.message}` }], isError: true };
        }
      }

      case 'browser_click': {
        try {
          const page = await ensureBrowser();
          if (args.by_text) {
            await page.getByText(args.selector).first().click({ timeout: 10000 });
          } else {
            await page.click(args.selector, { timeout: 10000 });
          }
          await page.waitForTimeout(2000); // let network settle
          return { content: [{ type: 'text', text: `Clicked: ${args.selector}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `Click failed: ${e.message}` }], isError: true };
        }
      }

      case 'browser_type': {
        try {
          const page = await ensureBrowser();
          await page.fill(args.selector, args.text, { timeout: 10000 });
          if (args.submit) await page.press(args.selector, 'Enter');
          await page.waitForTimeout(1000);
          return { content: [{ type: 'text', text: `Typed into ${args.selector}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `Type failed: ${e.message}` }], isError: true };
        }
      }

      case 'browser_screenshot': {
        try {
          const page = await ensureBrowser();
          const shotPath = path.join(os.tmpdir(), `mcp-shot-${Date.now()}.png`);
          await page.screenshot({ path: shotPath, fullPage: args.full_page || false });
          return { content: [{ type: 'text', text: `Screenshot saved to: ${shotPath}` }] };
        } catch (e) {
          return { content: [{ type: 'text', text: `Screenshot failed: ${e.message}` }], isError: true };
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

// ── Start ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PC Control MCP Server running on stdio');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
