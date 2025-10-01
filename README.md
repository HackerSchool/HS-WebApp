# 🏆 Hacker League

<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
  <img src="public/images/logo.png" alt="Hacker League Logo" width="150" height="150">
  <div>
    <h2>Welcome to <strong>Hacker League!</strong></h2>
    <p>A task-gamification system designed to recognize and reward the best contributors of HackerSchool through a structured competitive framework.</p>
  </div>
</div>

---

## 📜 Project History

This noble project, first wrought by the esteemed craftsman José Lopes (known throughout the realm as [@MIBismuth](https://github.com/MIBismuth)), was christened in days of yore as **"HS-WebApp"** and didst flourish under his skilled hand (consult ye the ancient scrolls preserved in the [legacy](https://github.com/HackerSchool/Hacker-League/tree/legacy) branch for proof of these bygone times).

Verily, this humble creation served as the cornerstone most foundational in the construction of the grand Hacker League project. Through great toil and scholarly pursuit, the project hath been most triumphantly transmuted from the primitive tongue of **vanilla JavaScript** unto the more refined and courtly language of **React**, thereby achieving superior maintainability and providing a most pleasant experience for all who venture forth to use it.

## 🔗 Related Repositories

- **[HS-API](https://github.com/HackerSchool/HS-API)** - Flask REST API backend for managing HackerSchool members and projects


---

## ✅ **Current Features**

### 🏠 **Leaderboard System**
- [x] **Interactive Leaderboard** with team and individual classifications
- [x] **Multiple Point Types**: Total, PJ (Journey Points), and PCC (Community Contribution Points)
- [x] **Dynamic Controls**: Inline dropdown menus for classification type and point filtering
- [x] **Medal System**: 🥇🥈🥉🎖️ for top 5 positions with position-specific colors
- [x] **Statistics Dashboard**: Total participants, active teams, and total points
- [x] **Expandable History**: Click rows to see recent activity with "See more" navigation
- [x] **Real-time Sorting**: Sort by Total Points, PJ Points, or PCC Points


### 📊 **History Page**
- [x] **Comprehensive Activity Log**: View all point attributions across teams and individuals
- [x] **Advanced Filtering**: Filter by entity type (Teams/Individuals), points type (PJ/PCC), and specific entities
- [x] **Chronological Sorting**: Automatically sorted from most recent to oldest entries
- [x] **Pagination**: Navigate through large datasets with 10 items per page
- [x] **Expandable Details**: Click rows to see full activity descriptions


### 👤 **User Profile System**
- [ ] **Personal Profile Management**: Edit user information, upload logos
- [x] **Logo Upload**: Local file upload with Base64 storage and persistence
- [x] **Team Selection**: Multi-team membership with checkbox interface
- [x] **Profile Data**: Display member number, join date, IST ID, roles, and additional info
- [x] **Edit Mode**: Toggle between view and edit modes with form validation

### 🔐 **Authentication System**
- [x] **Secure Login/Logout**: Cookie and local storage support
- [x] **Mock User System**: Available for development testing (admin, alexchen, mariasantos, davidkim)
- [x] **Session Management**: Persistent login state
- [x] **Role Management**: Admin and user roles with appropriate permissions

### 🛠️ **Admin Panel**

#### **User Management**
- [x] **Complete CRUD Operations**: Create, edit, and delete users
- [x] **Team Assignment**: Add users to multiple teams with coordinator role selection
- [x] **Create New Teams**: Inline team creation when adding users
- [x] **Role Management**: Assign and manage user roles (member, dev, rh, admin, sysadmin, etc.)
- [x] **Profile Management**: Edit IST ID, name, email, and other user details
- [x] **Pagination**: Navigate through user lists efficiently
- [x] **Form Validation**: Complete validation with error handling

#### **Points History Management**
- [x] **Award Points**: Create point entries for team members
- [x] **Multi-User Selection**: Award points to multiple users at once
- [x] **Points Types**: Support for PJ (Project), PCC (Community Contribution), and PS (Special) points
- [x] **Edit & Delete**: Modify or remove existing point entries
- [x] **Chronological Sorting**: View entries from most recent to oldest
- [x] **Team Integration**: Automatic team member fetching for point attribution
- [x] **Pagination**: Navigate through large point history datasets

--- 

## 🛠️ Tech Stack

- **Frontend**: React 18 with React Router v6
- **Backend API**: Flask REST API with SQLite database ([HS-API](https://github.com/HackerSchool/HS-API))
- **Local Backend**: Node.js/Express server for admin operations
- **State Management**: React Context API with hooks
- **Styling**: CSS3 with responsive design and custom color scheme
- **Authentication**: Cookie-based session management with Fenix OAuth integration
- **API Communication**: Axios with CORS support
- **File Handling**: FileReader API for local image uploads

## 📁 Project Structure

```
src/
├── components/
│   ├── Admin/
│   │   ├── AdminPanel.jsx
│   │   ├── UserManagement/
│   │   │   ├── UserManagement.jsx
│   │   │   └── UserManagement.css
│   │   ├── PointsHistory/
│   │   │   ├── PointsHistory.jsx
│   │   │   └── PointsHistory.css
│   │   └── ContentManagement/
│   │       ├── HallOfFameAdmin.jsx
│   │       ├── SeasonAdmin.jsx
│   │       └── HackNightAdmin.jsx
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   └── Auth.css
│   ├── History/
│   │   ├── History.jsx
│   │   └── History.css
│   ├── Layout/
│   │   ├── Navbar.jsx
│   │   └── Navbar.css
│   ├── Leaderboard/
│   │   ├── LeaderboardTable.jsx
│   │   └── Leaderboard.css
│   ├── Profile/
│   │   ├── UserProfile.jsx
│   │   └── Profile.css
│   ├── HallOfFame/
│   │   ├── HallOfFame.jsx
│   │   └── HallOfFame.css
│   ├── Modal/
│   │   ├── Modal.jsx
│   │   └── Modal.css
│   ├── Pagination/
│   │   ├── Pagination.jsx
│   │   └── Pagination.css
│   └── PrivateRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── LeaderboardPage.jsx
│   ├── HistoryPage.jsx
│   ├── ProfilePage.jsx
│   ├── HallOfFamePage.jsx
│   └── AdminPage.jsx
├── services/
│   ├── apiService.js
│   ├── memberService.js
│   ├── projectService.js
│   ├── taskService.js
│   └── projectParticipationService.js
├── App.jsx
└── index.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.11+ (for HS-API)
- pip or uv (Python package manager)

### Installation

1. **Clone the repositories**
   ```bash
   # Clone the main web app
   git clone https://github.com/HackerSchool/Hacker-League.git
   cd Hacker-League/HS-WebApp
   
   # Clone the API (in a separate location)
   git clone https://github.com/HackerSchool/HS-API.git
   ```

2. **Setup Backend API (HS-API)**
   ```bash
   cd HS-API
   # Install dependencies (using uv or pip)
   uv sync  # or: pip install -r requirements.txt
   
   # Run database migrations
   flask db upgrade
   
   # Start the API server
   flask run --port 8080
   ```

3. **Setup Local Backend Server**
   ```bash
   cd HS-WebApp/backend
   npm install
   npm start
   ```

4. **Setup Frontend**
   ```bash
   cd HS-WebApp
   npm install
   npm start
   ```

5. **Open your browser**
   - Frontend: `http://localhost:3000`
   - Flask API: `http://localhost:8080`
   - Local Backend: Port varies (check backend logs)

### Authentication

The application uses **Fenix OAuth** for authentication. Users can log in using their IST Técnico credentials.

For development/testing purposes, the backend includes populated test data with various users and teams.

### Building for Production

```bash
npm run build
```


## 🎨 Design System

### Color Scheme
- **Primary Dark**: `#2b2a28` (Dark gray)
- **Primary Green**: `#6dba76` (Green)
- **Primary Blue**: `#156082` (Blue)
- **Text**: White for contrast
- **Accent**: `#90EE90` (Light green for username)


## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The build folder contains static files that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

## 🤝 Contributing

### **Team Structure**

- **Decider**: Gonçalo Fecha
- **Developers**: André Caseiro, André Santos, Armando Gonçalves, Gonçalo Azevedo
- **Technical Expert**: José Lopes, Filipe Piçarra
- **Game Design**: João Rodrigues, Filipe Vaz
- **Logo Design**: Francisco Gonçalves

### **How to contribute** 

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
6. Pls Pls Pls remember to update README and rest of documentation, if existing.


## 📝 License

This project is licensed under the MIT License. Feel free to fork, modify, and share your improvements!

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/HackerSchool/Hacker-League/issues) page
2. Create a new issue with detailed information
3. Contact the development team
 

