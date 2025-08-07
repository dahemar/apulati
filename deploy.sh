#!/bin/bash

# 🚀 Quick Deploy Script for APULATI

echo "🎭 APULATI - Quick Deploy Script"
echo "================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're not on main branch (current: $current_branch)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    git status --short
    read -p "Commit and deploy anyway? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "🚀 Quick deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Build locally to check for errors
echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Push to GitHub (this will trigger GitHub Actions)
echo "📤 Pushing to GitHub..."
git push origin $current_branch

if [ $? -ne 0 ]; then
    echo "❌ Push failed!"
    exit 1
fi

echo "🎉 Deploy initiated!"
echo "📋 Monitor progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo "🌐 Site will be available at: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\)\/.*/\1/').github.io/apulati/"
echo ""
echo "⏱️  Deployment usually takes 2-3 minutes to complete." 