# 🤝 Contributing Guidelines

## 📋 Quy tắc Commit Message

Dự án sử dụng **Conventional Commits** để đảm bảo lịch sử commit rõ ràng và có thể tự động tạo CHANGELOG.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

| Type       | Mô tả                        | Example                                       |
| ---------- | ---------------------------- | --------------------------------------------- |
| `feat`     | Tính năng mới                | `feat(worker): add GPS-based job search`      |
| `fix`      | Sửa bug                      | `fix(farmer): resolve applicant filter crash` |
| `ui`       | Cập nhật UI/UX               | `ui(admin): redesign dashboard cards`         |
| `refactor` | Refactor code                | `refactor(auth): simplify token validation`   |
| `perf`     | Cải thiện performance        | `perf(worker): optimize job list rendering`   |
| `docs`     | Cập nhật documentation       | `docs(readme): add API integration guide`     |
| `style`    | Format code (prettier, lint) | `style: apply prettier to all tsx files`      |
| `test`     | Thêm/sửa tests               | `test(api): add unit tests for job service`   |
| `chore`    | Build, dependencies          | `chore: update next to 16.0.11`               |
| `config`   | Thay đổi config              | `config: add env variables for API`           |

### Scope

| Scope    | Mô tả                              |
| -------- | ---------------------------------- |
| `worker` | Worker-related components/features |
| `farmer` | Farmer-related components/features |
| `admin`  | Admin-related components/features  |
| `auth`   | Authentication/Authorization       |
| `api`    | API integration                    |
| `ui`     | UI components (shared)             |
| `layout` | Layout components                  |
| `db`     | Database changes                   |
| `config` | Configuration files                |
| `global` | Global/cross-cutting changes       |

### Subject

- Sử dụng imperative mood: "add" không phải "added" hay "adds"
- Không viết hoa chữ cái đầu
- Không dấu chấm (.) ở cuối
- Tối đa 50 ký tự

### Body (Optional)

- Giải thích **tại sao** thay đổi, không phải **làm gì**
- Wrap tại 72 ký tự
- Tách biệt với subject bằng 1 dòng trống

### Footer (Optional)

- Reference issues: `Closes #123`, `Refs #456`
- Breaking changes: `BREAKING CHANGE: description`

## ✅ Examples

### Good ✨

```bash
feat(worker): add job filter by wage range

Users can now filter jobs by minimum and maximum wage.
Includes validation for invalid ranges.

Closes #45
```

```bash
fix(farmer): resolve payment calculation error

Fixed rounding issue that caused incorrect total
when multiple workers complete the same job.
```

```bash
ui(admin): update dashboard chart colors

Changed chart palette to match new brand guidelines.
Improved contrast for better accessibility.
```

### Bad ❌

```bash
# Quá chung chung
fix: bug fixes

# Không có scope
Added new feature

# Quá dài subject
feat(worker): add comprehensive job search functionality with advanced filtering options including location distance wage range and job type selection

# Không imperative mood
fixed the payment bug
```

## 🔧 Setup Git Commit Template

Để tự động sử dụng commit template:

```bash
git config --local commit.template .gitmessage
```

## 🌿 Branching Strategy

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch cho features

### Feature Branches

Format: `<type>/<scope>-<short-description>`

```bash
feat/worker-job-search
fix/farmer-payment-bug
ui/admin-dashboard-redesign
refactor/auth-login-flow
```

### Workflow

1. Tạo branch từ `develop`

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/worker-wallet
   ```

2. Commit thường xuyên với message rõ ràng

   ```bash
   git add .
   git commit
   # Editor sẽ mở với template
   ```

3. Push và tạo Pull Request

   ```bash
   git push origin feat/worker-wallet
   ```

4. Code review và merge vào `develop`

5. Định kỳ merge `develop` → `main`

## 📝 Pull Request Guidelines

### Title Format

Giống như commit message: `<type>(<scope>): <description>`

### Description Template

```markdown
## 📋 Description

Brief description of changes

## 🎯 Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] UI/UX update
- [ ] Refactoring
- [ ] Documentation

## 🧪 Testing

- [ ] Tested locally
- [ ] Added unit tests
- [ ] Manual testing completed

## 📸 Screenshots (if UI changes)

[Add screenshots here]

## 📌 Related Issues

Closes #123
Refs #456

## ✅ Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No console.log/debugger left behind
- [ ] Documentation updated
```

## 🎨 Code Style

### TypeScript/React

```tsx
// ✅ Good: Named exports for components
export function WorkerDashboard() {
  return <div>...</div>;
}

// ✅ Good: Type props properly
interface Props {
  userId: string;
  onComplete: () => void;
}

// ✅ Good: Use const for immutable values
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ❌ Bad: Default export for components
export default function Component() {}

// ❌ Bad: Any type
const data: any = await fetch();
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `WorkerDashboard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-currency.ts`)
- Hooks: `use-*.ts` (e.g., `use-auth.ts`)

### Folder Structure

```
components/
  ui/              → Shared UI components
  worker/          → Worker-specific components
  farmer/          → Farmer-specific components
  admin/           → Admin-specific components

app/               → Next.js pages
lib/               → Utilities, helpers
hooks/             → Custom React hooks
types/             → TypeScript types/interfaces
constants/         → App constants
```

## 🧪 Testing

```bash
# Run linter
pnpm lint

# Run tests (when available)
pnpm test
```

**Note:** Project uses pnpm as the primary package manager. Always use pnpm for installing dependencies to avoid lockfile conflicts.

## 📦 Before Committing

1. ✅ Code compiles without errors
2. ✅ No TypeScript errors
3. ✅ Linter passes
4. ✅ Tested locally
5. ✅ Remove console.log/debugger
6. ✅ Update documentation if needed

## 🚀 Release Process

1. Merge `develop` → `main`
2. Tag version: `git tag v1.0.0`
3. Push tag: `git push origin v1.0.0`
4. Create release notes từ commits
5. Deploy to production

## 💡 Tips

- Commit nhỏ, thường xuyên
- 1 commit = 1 logical change
- Write commits như bạn đang giải thích cho teammate
- Reference issues để track progress
- Review code của bạn trước khi commit

## ❓ Questions?

Liên hệ team lead hoặc tạo issue trong repo.

---

**Happy Coding! 🎉**
