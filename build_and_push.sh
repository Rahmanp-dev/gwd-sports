#!/bin/bash

# Exit immediately if a command fails
set -e

echo "🔨 Building project..."
if npm run build; then
    echo "✅ Build succeeded. Committing and pushing..."
    
    # Add all changes
    git add .
    
    # Commit with a default message (or pass your own message as an argument)
    git commit -m "${1:-Auto commit after successful build}"
    
    # Push to the current branch
    git push

    echo "🚀 Code pushed successfully!"
else
    echo "❌ Build failed. Fix errors before committing."
    exit 1
fi