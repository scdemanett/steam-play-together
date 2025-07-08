# 🎮 Steam Play Together

**Find games you and your friends can play together!**

Steam Play Together is a modern web application that helps you discover which games you have in common with your Steam friends. No more scrolling through endless Steam libraries or asking "What should we play?" in Discord.

## 🌐 Live Demo

**[Try Steam Play Together Now →](https://steamplaytogether.com/)**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-06B6D4)](https://tailwindcss.com/)
[![Shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-black)](https://ui.shadcn.com/)

## ✨ Features

### 🔍 **Smart Game Discovery**
- **Common Games Finder**: Instantly discover games owned by you and your selected friends
- **Steam Library Browser**: View your complete Steam library with detailed playtime statistics
- **Platform-Specific Playtime**: See hours played on Windows, Mac, Linux, and Steam Deck
- **Advanced Search & Sorting**: Filter by game name or App ID, sort by any column

### 👥 **Flexible Friends Management**
- **Steam Integration**: Load friends directly from your Steam friends list
- **Selective Adding**: Choose which friends to compare games with using checkboxes
- **Manual Adding**: Add friends by Steam ID or username with automatic profile lookup
- **Avatar Display**: See friend avatars and Steam profile information

### ⚡ **Performance & Caching**
- **Smart Caching**: 1-hour cache for library data, 30-minute cache for friends
- **Persistent State**: Remember your page, sorting, and search preferences
- **Rate Limit Handling**: Intelligent handling of Steam API rate limits with user-friendly messages
- **Pagination**: Handle large libraries with 10/25/50/100 games per page

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Dual Pagination**: Navigate from top or bottom of tables
- **Real-time Status**: See cache status and last updated timestamps
- **Toast Notifications**: Clear feedback for all actions

### 🔐 **Secure Authentication**
- **Steam OpenID 2.0 Login**: Official Steam authentication (recommended)
- **Manual Entry Option**: Enter Steam ID or username if preferred
- **Automatic Account Linking**: Steam login automatically retrieves your Steam ID
- **Secure Session Handling**: Temporary cookie-based authentication flow

### 🔒 **Privacy & Security**
- **Local API Key Storage**: Your Steam API key is stored only in your browser's localStorage
- **Secure Proxy Routes**: API key is sent only to our Next.js backend (never stored server-side)
- **No Third-Party Access**: Your API key only reaches Steam through our secure proxy
- **No Data Collection**: Your gaming data stays on your device

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Steam API Key** ([Get one here](https://steamcommunity.com/dev/apikey))
- **Steam ID** ([Find yours here](https://steamid.io/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/steam-play-together.git
   cd steam-play-together
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional for local development)**
   ```bash
   # Copy from example file
   cp env.example .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in your browser**
   ```
   http://localhost:3000
   ```

### Configuration

1. **Get your Steam API Key**
   - Visit [Steam Web API Registration](https://steamcommunity.com/dev/apikey)
   - Register using your Steam account
   - Your API key will be displayed - copy it!

2. **Configure the app**
   - Go to the app in your browser
   - Enter your Steam API Key when prompted
   - Choose your preferred authentication method:
     - **Steam Login (Recommended)**: Click "Login with Steam" for automatic setup
     - **Manual Entry**: Enter your Steam ID or username manually

3. **Environment Variables**
   
   **For Local Development:**
   ```bash
   # Copy env.example to .env.local
   cp env.example .env.local
   ```
   
   **For Production Deployment:**
   Set the following environment variable in your hosting platform:
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
   
   See the [Environment Variables](#environment-variables) section below for detailed setup instructions.

## 📖 How to Use

### 1. **Browse Your Library**
- Navigate to the "Library" tab
- Your Steam games will load automatically
- Use search, sorting, and pagination to explore
- See detailed playtime across all platforms

### 2. **Find Friends to Play With**
- Go to the "Play Together" tab
- Add friends manually by Steam ID/username, or
- Click "Load Friends from Steam" to import your Steam friends
- Select which friends you want to compare games with
- Click "Add Selected" to add them to your comparison list

### 3. **Discover Common Games**
- With friends added, click "Find Common Games"
- View all games you have in common
- Launch games directly from the list using Steam URIs
- Get insights about friends with private profiles

### 4. **Customize Your Experience**
- Toggle between light and dark themes
- Adjust pagination settings (10-100 games per page)
- Use "Reset View" to return to default table settings
- Clear cache when needed in Settings

## 🛠️ Technical Architecture

### **Frontend Stack**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Latest utility-first styling with enhanced performance
- **Shadcn/ui**: High-quality React components
- **Lucide React**: Beautiful icons
- **Sonner**: Toast notifications

### **Backend & API**
- **Next.js API Routes**: Secure proxy for Steam API
- **Axios**: HTTP client with error handling
- **Steam Web API**: Official Steam data source

### **Key Features**
- **React Context**: Global state management for games, friends, and settings
- **localStorage**: Client-side caching and preferences
- **Memoization**: Performance optimization for large datasets
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Mobile-first approach

### **Steam API Integration**
```
Browser (localStorage) → Next.js API Routes → Steam Web API
```
- API keys stored locally in browser, passed through our secure proxy
- Server-side rate limiting and error handling
- No server-side API key storage or persistence
- Consistent error messages for users

## 🌍 Environment Variables

### **Required for Production Deployment**

The app requires environment variables to function correctly in production, particularly for Steam authentication.

### **Setup Instructions**

1. **Create environment file**
   ```bash
   # For local development, copy from example
   cp env.example .env.local
   
   # Or create manually
   echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" > .env.local
   ```

2. **For Production Deployment**
   
   Set `NEXT_PUBLIC_APP_URL` to your actual deployed domain:

   **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_APP_URL` = `https://your-app-name.vercel.app`

   **Netlify:**
   - Go to Site Settings → Environment Variables  
   - Add: `NEXT_PUBLIC_APP_URL` = `https://your-app-name.netlify.app`

   **Other Platforms:**
   - Set `NEXT_PUBLIC_APP_URL` to your deployed URL
   - Example: `https://steamplaytogether.com`

### **Why This Is Required**

- **Steam Authentication**: Steam OAuth requires a valid return URL
- **Security**: Ensures Steam can validate and redirect to your domain
- **CORS**: Prevents cross-origin issues in production

### **Environment Variables Reference**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's deployed URL | Yes (Production) | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | No | Auto-set by hosting platforms |

⚠️ **Important**: Without `NEXT_PUBLIC_APP_URL` in production, Steam login will fail because it tries to redirect to `localhost:3000`.

## 🔧 API Endpoints

The app includes several proxy endpoints for Steam API access:

- `POST /api/steam/validate` - Validate API key
- `POST /api/steam/owned-games` - Get user's game library
- `POST /api/steam/friends-list` - Get Steam friends
- `POST /api/steam/player-summaries` - Get player profiles
- `POST /api/steam/common-games` - Find common games
- `POST /api/steam/resolve-vanity` - Convert username to Steam ID

## 🎯 Use Cases

### **Gaming Groups**
- Quickly find what your Discord server can play together
- Discover forgotten games in your collections
- Plan gaming sessions with friends

### **Steam Power Users**
- Analyze your gaming habits across platforms
- Explore your library with advanced filtering
- Track playtime statistics

### **Friend Discovery**
- See what games friends have been playing
- Find common interests for new friendships
- Compare gaming preferences

## ⚠️ Rate Limiting

Steam API has rate limits (200 calls per 5 minutes). The app handles this gracefully:

- **Smart Caching**: Reduces API calls significantly
- **Error Handling**: Clear messages when limits are hit
- **User Guidance**: Tells you exactly how long to wait
- **Fail-Fast**: Stops processing when rate limited

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing code style
- Add proper error handling
- Update documentation for new features
- Test with various Steam profiles

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Steam Web API** - For providing access to Steam data
- **Shadcn/ui** - For the beautiful component library
- **Vercel** - For hosting and deployment platform
- **Steam Community** - For being awesome gamers

## 📞 Support

Having issues? Here are some common solutions:

### **"Invalid API Key"**
- Double-check your API key from Steam
- Make sure you're using the correct Steam ID format (64-bit)
- Try the "Test Configuration" button in Settings

### **"Rate Limited"**
- Wait 5-10 minutes before trying again
- Steam limits API calls to prevent server overload
- Consider using cached data when available

### **"No Common Games Found"**
- Check if friends have public Steam profiles
- Verify friends actually own the same games
- Some friends might have private game libraries

### **"Friends Not Loading"**
- Ensure your Steam profile friends list is public
- Check if the Steam ID is correct
- Try refreshing your friends list

---

**Made with ❤️ for the Steam gaming community**

*Happy gaming! 🎮*
