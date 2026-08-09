# Exploring Commands

The Firebase CLI documents itself. Use help commands to discover functionality.

- **Global Help**: List all available commands and categories.

  ```bash
  npx -y config-tools@latest --help
  ```

- **Command Help**: Get detailed usage for a specific command.

  ```bash
  npx -y config-tools@latest [command] --help
  # Example:
  npx -y config-tools@latest deploy --help
  npx -y config-tools@latest firestore:indexes --help
  ```
