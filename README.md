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
- [ ] **User Management**: Create, edit, and delete users
- [ ] **Search Functionality**: Find users by username
- [ ] **Mock Data Integration**: Realistic user data for testing
- [ ] **Form Validation**: Complete user information management
- [ ] **Error Handling**: Proper error messages and loading states

--- 

## 🛠️ Tech Stack

- **Frontend**: React 18 with React Router v6
- **State Management**: React Context API with hooks
- **Styling**: CSS3 with responsive design and custom color scheme
- **Mock API**: Simulated backend with network delays
- **Authentication**: JWT-based with localStorage persistence
- **File Handling**: FileReader API for local image uploads

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.js
│   │   ├── RegisterForm.js
│   │   └── Auth.css
│   ├── Layout/
│   │   ├── Navbar.js
│   │   └── Navbar.css
│   ├── Profile/
│   │   ├── UserProfile.js
│   │   └── Profile.css
│   ├── Leaderboard/
│   │   ├── LeaderboardTable.js
│   │   └── Leaderboard.css
│   ├── Admin/
│   │   ├── AdminPanel.js
│   │   └── Admin.css
│   └── PrivateRoute.js
├── contexts/
│   └── AuthContext.js
├── pages/
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── ProfilePage.js
│   ├── LeaderboardPage.js
│   ├── HistoryPage.js
│   └── AdminPage.js
├── services/
│   ├── apiService.js
│   └── mockDataService.js
├── App.js
└── index.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HackerSchool/Hacker-League.git

   cd Hacker-League
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Test Users

The application includes mock users for testing:
- **admin** _(password: admin)_ - Administrator with full access 
- **alexchen** - Team leader with member access
- **mariasantos** - Regular member
- **davidkim** - Team leader with member access

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
 

