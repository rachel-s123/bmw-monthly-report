# BMW Dashboard Scripts

This directory contains scripts to help you start and manage the BMW Monthly Report Dashboard with Supabase integration.

## 🚀 Available Scripts

### Quick Start Scripts

#### `npm run start:supabase`
**Node.js version** - Comprehensive startup script with environment checking
- ✅ Checks for `.env` file and Supabase credentials
- ✅ Builds the project first
- ✅ Starts development server and build watcher
- ✅ Provides colored output and status messages
- ✅ Graceful shutdown handling

#### `npm run start:supabase:sh`
**Shell script version** - Alternative startup script
- ✅ Same features as Node.js version
- ✅ Works on Unix-like systems (macOS, Linux)
- ✅ Faster startup time

#### `npm run supabase:dev`
**Simple concurrent startup** - Basic development environment
- ✅ Starts dev server and build watcher simultaneously
- ✅ No environment checking
- ✅ Quick startup for development

### Development Scripts

#### `npm run dev:supabase`
Starts both development server and build watcher using concurrently.

#### `npm run build:watch`
Builds the project and watches for changes, rebuilding automatically.

#### `npm run test:supabase`
Builds the project first, then starts the development server.

#### `npm run supabase:setup`
Legacy setup script - builds then starts dev server.

## 📋 Prerequisites

Before running any of these scripts, make sure you have:

1. **Supabase Project**: Created and configured
2. **Environment Variables**: `.env` file with your Supabase credentials
3. **Dependencies**: All npm packages installed (`npm install`)

## 🔧 Environment Setup

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🎯 Usage Examples

### For Development (Recommended)
```bash
# Full environment with checks
npm run start:supabase

# Or using shell script
npm run start:supabase:sh

# Simple concurrent startup
npm run supabase:dev
```

### For Testing
```bash
# Test build and start dev server
npm run test:supabase
```

### For Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Script Details

### `start-supabase.js`
- **Type**: Node.js script
- **Features**:
  - Environment validation
  - Build verification
  - Concurrent process management
  - Colored console output
  - Error handling
  - Graceful shutdown

### `start-supabase.sh`
- **Type**: Bash script
- **Features**:
  - Same features as Node.js version
  - Unix-compatible
  - Faster execution
  - Shell-native error handling

## 🔍 What Each Script Does

### Development Server
- Runs on `http://localhost:5173` (or next available port)
- Hot module replacement (HMR)
- Real-time file watching
- Fast refresh for React components

### Build Watcher
- Watches for file changes
- Automatically rebuilds on changes
- Outputs to `dist/` directory
- Optimized for production

### Concurrent Execution
- Both processes run simultaneously
- Shared console output
- Coordinated shutdown
- Process management

## 🚨 Troubleshooting

### Common Issues

1. **"Port already in use"**
   - The dev server will automatically find the next available port
   - Check the console output for the actual URL

2. **"Build failed"**
   - Check for syntax errors in your code
   - Verify all dependencies are installed
   - Check the build output for specific errors

3. **"Environment variables not found"**
   - Ensure `.env` file exists in project root
   - Verify Supabase credentials are correct
   - Check file permissions

4. **"Supabase connection failed"**
   - Verify your Supabase project is active
   - Check your API keys are correct
   - Ensure internet connectivity

### Debug Mode

To enable debug logging, add to your `.env`:
```env
VITE_DEBUG=true
```

## 📊 Performance Tips

1. **Use `npm run start:supabase`** for the most comprehensive startup experience
2. **Use `npm run supabase:dev`** for faster development cycles
3. **Use `npm run build:watch`** if you only need the build watcher
4. **Kill processes with Ctrl+C** for graceful shutdown

## 🔄 Workflow Integration

### VS Code Integration
Add to your VS Code settings for easy access:

```json
{
  "npm.packageManager": "npm",
  "npm.runSilent": false,
  "terminal.integrated.env.osx": {
    "NODE_ENV": "development"
  }
}
```

### Git Hooks
Consider adding pre-commit hooks to ensure builds work:

```bash
# .git/hooks/pre-commit
npm run build
```

## 📞 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify your Supabase configuration
3. Ensure all dependencies are up to date
4. Try running individual commands to isolate issues

## 🎯 Next Steps

After successful startup:

1. **Upload CSV files** to test Supabase integration
2. **Check Supabase dashboard** to verify file storage
3. **Test data processing** and insight generation
4. **Customize the application** for your specific needs 