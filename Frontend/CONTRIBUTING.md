# 🤝 Contributing Guide

Thank you for wanting to contribute to Rexi Veterinary Clinic Project!

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "QLy Phòng Khám Thú Y"

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development Workflow

### 1. Code Quality

Before committing, ensure your code passes all checks:

```bash
# Lint TypeScript
npm run lint:eslint

# Format code
npm run format

# Type check
npm run type-check

# Run tests
npm run test
```

### 2. Branch Naming

Use descriptive branch names:
- `feature/add-user-dashboard` - New feature
- `fix/login-bug` - Bug fix
- `docs/update-readme` - Documentation
- `chore/update-dependencies` - Maintenance

### 3. Commit Messages

Follow Conventional Commits:

```
feat: add email verification feature
fix: resolve mobile menu toggle issue
docs: update installation guide
chore: update dependencies
test: add Header component tests
refactor: improve API error handling
```

### 4. Pull Request Process

1. Create a new branch from `main`
2. Make your changes
3. Run full QA: `npm run qa`
4. Push changes and create a Pull Request
5. Ensure CI passes
6. Request review from maintainers
7. Merge after approval

## Code Style

We follow these conventions:

### TypeScript
- Use `strict` mode
- Avoid `any` type (use `unknown` if necessary)
- Add return type annotations
- Use interfaces for object types

### React
- Functional components only
- Use hooks for state management
- Props should be typed
- Use meaningful component names

### CSS
- Use CSS variables from theme
- Follow mobile-first approach
- Use consistent spacing (multiples of 4px)
- Prefix custom properties with `--`

### Example Component

```typescript
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-label={label}
    >
      {label}
    </button>
  );
};

export default Button;
```

## Testing

### Writing Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles click event', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Test Coverage

We aim for >80% coverage:
- All components should have tests
- Test user interactions
- Test error states
- Mock external dependencies

## Documentation

When adding features:
1. Update README if needed
2. Add JSDoc comments to functions
3. Document complex logic
4. Include examples for new components

Example JSDoc:

```typescript
/**
 * Formats a number as Vietnamese currency
 * @param amount - The amount in VND
 * @returns Formatted currency string
 * @example
 * formatCurrency(1000000) // "1.000.000 ₫"
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

## Common Tasks

### Add New Page
1. Create file in `src/pages/`
2. Import in `src/App.tsx`
3. Add route in Routes
4. Create tests

### Add New Component
1. Create folder in `src/components/`
2. Create component and types
3. Add to component index if needed
4. Create `.test.tsx` file
5. Document with JSDoc

### Update API Integration
1. Update endpoint in `src/services/axios.ts` if needed
2. Update types in `src/types/`
3. Update component to handle new data
4. Test with backend
5. Add error handling

## Git Workflow

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: describe your changes"

# Push to remote
git push origin feature/my-feature

# Create Pull Request on GitHub
```

## Performance Tips

- Use React.memo for expensive components
- Lazy load routes with React.lazy
- Optimize images and assets
- Use CSS variables for theming
- Minimize bundle size
- Avoid inline objects in JSX

## Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Color contrast >= 4.5:1
- [ ] Form labels properly associated
- [ ] ARIA labels where needed
- [ ] Focus visible
- [ ] Alt text for images
- [ ] Semantic HTML

## Security Checklist

- [ ] No hardcoded secrets
- [ ] Validate user input
- [ ] Sanitize API responses
- [ ] Use HTTPS
- [ ] Set proper headers
- [ ] XSS protection enabled
- [ ] CSRF tokens for forms

## Getting Help

- Check existing issues/PRs
- Read project documentation
- Ask in discussions
- Open an issue for bugs
- Email: contact@rexi-clinic.com

## Code Review Process

Reviewers will check:
- Code quality and style
- Test coverage
- Performance impact
- Security concerns
- Documentation
- Accessibility

## Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Added to CONTRIBUTORS.md

Thank you for contributing! 🙏