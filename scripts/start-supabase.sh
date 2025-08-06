#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}🚀 $1${NC}"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_info "Please create a .env file with your Supabase credentials:"
        echo "VITE_SUPABASE_URL=https://your-project-id.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=your-anon-key-here"
        exit 1
    fi

    # Check if Supabase credentials are present
    if ! grep -q "VITE_SUPABASE_URL" .env || ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        print_error "Missing Supabase credentials in .env file!"
        print_info "Please add your Supabase URL and anon key to the .env file."
        exit 1
    fi

    print_status "Environment variables found"
}

# Main function
main() {
    print_header "Starting BMW Monthly Report Dashboard with Supabase..."
    echo ""

    # Check environment
    print_info "Checking environment configuration..."
    check_env

    # Build the project first
    print_info "Building project..."
    if npm run build; then
        print_status "Build completed successfully"
    else
        print_error "Build failed!"
        exit 1
    fi

    echo ""
    print_header "Starting development server and build watcher..."
    echo ""

    # Start both processes using concurrently
    print_info "Starting development environment..."
    npm run start:full
}

# Handle script interruption
trap 'echo ""; print_info "Shutting down..."; exit 0' INT TERM

# Run main function
main 