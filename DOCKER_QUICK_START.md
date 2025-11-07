# 🐳 Docker Git Push - Quick Start

## TL;DR - Just Want to Push?

```bash
# 1. Build (one time)
docker build -f Dockerfile.dev -t mafia-game-dev .

# 2. Run container
docker run -it --name mafia-git -v "$(pwd):/workspace" mafia-game-dev

# 3. Configure git (one time)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 4. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Or Use Docker Compose (Easier!)

```bash
# Start container
docker-compose up -d
docker-compose exec dev-environment bash

# Now you're inside! Configure and push as above
```

## Daily Workflow

```bash
# Start existing container
docker start -i mafia-git

# Make changes, then:
git add .
git commit -m "Your changes"
git push

# Exit
exit
```

## Important Notes

⚠️ **Use Personal Access Token, NOT password!**
- Create at: GitHub → Settings → Developer Settings → Personal Access Tokens
- When pushing, use token as password

🔑 **First Time Setup:**
1. Create GitHub repo
2. Generate Personal Access Token
3. Configure git inside container
4. Push!

📦 **Your files are safe:**
- Mounted from your laptop
- Changes in container = changes on laptop
- Nothing is lost if container is deleted

## Need Help?

See `DOCKER_GIT_SETUP.md` for detailed instructions!
