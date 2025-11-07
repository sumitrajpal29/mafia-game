# Docker Setup for Git Push

This guide helps you push your project to GitHub from inside a Docker container (useful when you can't push directly from your company laptop).

## Quick Start

### 1. Build the Docker Image

```bash
cd /Users/rajmishr/cascade/CascadeProjects/windsurf-project/mafia-game
docker build -f Dockerfile.dev -t mafia-game-dev .
```

### 2. Run Container with Project Mounted

```bash
docker run -it \
  --name mafia-git \
  -v "$(pwd):/workspace" \
  -p 3000:3000 \
  -p 3001:3001 \
  mafia-game-dev \
  bash
```

**Windows (PowerShell):**
```powershell
docker run -it --name mafia-git -v "${PWD}:/workspace" -p 3000:3000 -p 3001:3001 mafia-game-dev bash
```

**Windows (CMD):**
```cmd
docker run -it --name mafia-git -v "%cd%:/workspace" -p 3000:3000 -p 3001:3001 mafia-game-dev bash
```

### 3. Inside the Container - Configure Git

Once inside the container, configure git:

```bash
# Set your GitHub credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Optional: Configure Git to store credentials
git config --global credential.helper store
```

### 4. Initialize and Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Mafia party game"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/mafia-game.git

# Push to GitHub
git push -u origin main
```

**If you need to create main branch:**
```bash
git branch -M main
git push -u origin main
```

## Common Git Commands

### Check Status
```bash
git status
```

### Make Changes and Push
```bash
git add .
git commit -m "Your commit message"
git push
```

### Pull Latest Changes
```bash
git pull
```

### Create a New Branch
```bash
git checkout -b feature-name
git push -u origin feature-name
```

### View Commit History
```bash
git log --oneline
```

## Managing the Container

### Stop the Container
```bash
# Exit from inside container
exit

# Or stop from outside
docker stop mafia-git
```

### Restart Existing Container
```bash
docker start -i mafia-git
```

### Remove Container
```bash
docker rm mafia-git
```

### Remove Image
```bash
docker rmi mafia-game-dev
```

### View Running Containers
```bash
docker ps
```

### View All Containers
```bash
docker ps -a
```

## Setting Up GitHub Repository

### 1. Create New Repository on GitHub
- Go to https://github.com/new
- Create a new repository (e.g., `mafia-game`)
- **Don't** initialize with README, .gitignore, or license (you already have them)

### 2. Get Repository URL
After creating, GitHub will show you the URL:
```
https://github.com/yourusername/mafia-game.git
```

### 3. Push from Docker Container
Follow the commands in step 4 above with your actual repository URL.

## Authentication Options

### Option 1: Personal Access Token (Recommended)

1. **Create a Personal Access Token on GitHub:**
   - Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name: "Mafia Game Docker"
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Use Token Instead of Password:**
   ```bash
   git push
   # Username: your-github-username
   # Password: paste-your-token-here
   ```

3. **Store Credentials (Optional):**
   ```bash
   git config --global credential.helper store
   # Next time you push, credentials will be saved
   ```

### Option 2: SSH Keys

1. **Generate SSH key inside container:**
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   # Press Enter for all prompts to use defaults
   ```

2. **Display public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. **Add to GitHub:**
   - Go to: Settings → SSH and GPG keys → New SSH key
   - Paste the public key
   - Save

4. **Use SSH URL for remote:**
   ```bash
   git remote set-url origin git@github.com:yourusername/mafia-game.git
   ```

## Testing the Setup

### Verify Git is Working
```bash
# Inside container
git --version
node --version
npm --version
```

### Verify Files are Mounted
```bash
# Inside container
ls -la
# You should see all your project files
```

### Make a Test Commit
```bash
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "Test commit from Docker"
git push
# Then delete the test file
rm TEST.md
git add TEST.md
git commit -m "Remove test file"
git push
```

## Workflow Example

### Complete Workflow from Start to Finish

```bash
# 1. Build image (one time only)
docker build -f Dockerfile.dev -t mafia-game-dev .

# 2. Run container with mounted volume
docker run -it --name mafia-git -v "$(pwd):/workspace" -p 3000:3000 -p 3001:3001 mafia-game-dev bash

# --- Now you're inside the container ---

# 3. Configure git (one time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 4. Initialize repository (if not done)
git init

# 5. Add files
git add .

# 6. Commit
git commit -m "Initial commit: Mafia party game"

# 7. Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/mafia-game.git

# 8. Push
git branch -M main
git push -u origin main
# Enter username and personal access token when prompted

# 9. Exit container
exit

# Future pushes:
# Just start the container and push
docker start -i mafia-git
git add .
git commit -m "Update: added new feature"
git push
exit
```

## Running the App from Docker

If you want to run the app from inside the container:

```bash
# Inside container

# Terminal 1 - Run server
cd /workspace/server
npm install  # First time only
npm start

# Terminal 2 - Run client (open another terminal)
docker exec -it mafia-git bash
cd /workspace/client
npm install  # First time only
npm start
```

Then access:
- Client: http://localhost:3000
- Server: http://localhost:3001

## Troubleshooting

### Permission Denied
If you get permission errors:
```bash
# Inside container
chmod -R 755 /workspace
```

### Git Authentication Failed
- Make sure you're using a Personal Access Token, not your password
- Check token has `repo` permissions
- Verify username is correct

### Container Won't Start
```bash
# Remove and recreate
docker rm mafia-git
docker run -it --name mafia-git -v "$(pwd):/workspace" -p 3000:3000 -p 3001:3001 mafia-game-dev bash
```

### Files Not Showing in Container
- Make sure you're in the correct directory when running docker run
- Use absolute path: `-v /full/path/to/mafia-game:/workspace`

### Port Already in Use
```bash
# Use different ports
docker run -it --name mafia-git -v "$(pwd):/workspace" -p 3002:3000 -p 3003:3001 mafia-game-dev bash
```

## Clean Up Everything

To completely remove all Docker artifacts:

```bash
# Stop and remove container
docker stop mafia-git
docker rm mafia-git

# Remove image
docker rmi mafia-game-dev

# Remove unused Docker resources (optional)
docker system prune -a
```

## Notes

- All changes made inside the container are reflected in your host machine (and vice versa) because of the mounted volume
- Git commits and pushes happen from inside the container, so they bypass your company laptop's restrictions
- Your git configuration inside the container is separate from your host machine
- The container has its own git credentials that won't affect your host machine

## Security Tips

1. **Don't commit sensitive data:**
   - Check `.gitignore` is working
   - Never commit `.env` files with secrets

2. **Use Personal Access Tokens:**
   - More secure than passwords
   - Can be revoked easily
   - Scope limited to what you need

3. **Keep credentials safe:**
   - Don't share your token
   - Use `credential.helper store` only on trusted systems

## Summary

You now have a Docker container that:
- ✅ Has Git installed
- ✅ Has Node.js and npm
- ✅ Mounts your project files
- ✅ Can push to GitHub without company restrictions
- ✅ Can run your development servers

Happy coding! 🎮🐳
