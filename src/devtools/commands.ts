// src/devtools/commands.ts
import minimist from 'minimist'

type CommandFn = (args: minimist.ParsedArgs) => string | void

interface CommandDef {
  name: string
  description: string
  fn: CommandFn
}

export class CommandRegistry {
  private commands = new Map<string, CommandDef>()

  constructor() {
    // Built-in help command
    this.register('help', 'List all available commands', () => {
      const lines = ['Available commands:']
      for (const cmd of this.commands.values()) {
        lines.push(`  ${cmd.name.padEnd(16)} ${cmd.description}`)
      }
      return lines.join('\n')
    })
  }

  register(name: string, description: string, fn: CommandFn): void {
    this.commands.set(name, { name, description, fn })
  }

  execute(input: string): string {
    const parts = input.trim().split(/\s+/)
    const name = parts[0]
    const args = minimist(parts.slice(1))

    const cmd = this.commands.get(name)
    if (!cmd) return `Unknown command: "${name}". Type "help" for available commands.`

    const result = cmd.fn(args)
    return result ?? ''
  }
}
