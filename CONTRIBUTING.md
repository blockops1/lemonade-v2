# Contributing to Lemonade Stand Game

Thank you for your interest in contributing to the Lemonade Stand Game! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues section
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - A clear, descriptive title
   - Detailed description of the feature
   - Use cases and benefits
   - Any implementation ideas you have

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature/fix
3. Make your changes
4. Run tests and ensure they pass
5. Update documentation if needed
6. Submit a pull request

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused

### Testing

- Write tests for new features
- Ensure all tests pass
- Maintain or improve test coverage

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── circuits/           # Zero-knowledge circuits
├── context/           # React context providers
├── game/             # Game logic
├── hooks/            # Custom React hooks
├── proofs/           # Zero-knowledge proofs
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with your changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Questions?

Feel free to open an issue for any questions about contributing. 