# Personalized Autism Therapy Support System

A beautiful, modern web-based platform that helps caregivers and therapists deliver personalized autism care through intelligent activity recommendations. The system recommends activities to improve social, behavioral, and emotional aspects of children with autism.

## 🌟 Features

- **Personalized Activity Recommendations**: AI-powered recommendations based on each child's unique profile and needs
- **Child Profile Management**: Create and manage profiles for multiple children with specific needs tracking
- **Activity Library**: Comprehensive collection of activities categorized by:
  - **Social**: Activities to improve social interactions, communication, and peer relationships
  - **Behavioral**: Activities to support behavior management, routines, and self-regulation
  - **Emotional**: Activities to enhance emotional awareness, expression, and regulation
- **Beautiful, Modern UI**: Responsive design with intuitive interface for caregivers and therapists
- **Detailed Activity Information**: Each activity includes materials, duration, difficulty, benefits, and age recommendations

## 🎯 Project Structure

```
.
├── backend
│   ├── index.js          # Express API server with recommendation engine
│   ├── package.json
│   └── package-lock.json
├── frontend
│   ├── src
│   │   ├── App.js        # Main React application component
│   │   ├── App.css       # Beautiful styling and responsive design
│   │   ├── index.js
│   │   └── index.css
│   ├── public
│   └── package.json
└── README.md
```

## 🛠️ Technologies Used

*   **Frontend:** React 19, Axios, Modern CSS with gradients and animations
*   **Backend:** Node.js, Express.js, CORS
*   **Recommendation Engine:** Custom algorithm based on child needs, preferences, and activity matching

## 🚀 Getting Started

### Prerequisites

*   Node.js (v14 or higher)
*   npm (v6 or higher)

### Installation

1.  Clone the repository
    ```sh
    git clone https://github.com/your_username_/Personalized-Autism-Therapy-Support-System.git
    cd Personalized-Autism-Therapy-Support-System
    ```

2.  Install backend dependencies
    ```sh
    cd backend
    npm install
    ```

3.  Install frontend dependencies
    ```sh
    cd ../frontend
    npm install
    ```

## 🎮 Running the Application

### Start the Backend Server

Open a terminal and run:
```sh
cd backend
npm start
```

The backend server will start on `http://localhost:3001`

### Start the Frontend Application

Open a new terminal and run:
```sh
cd frontend
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## 📖 How to Use

1. **Select a Child Profile**: Choose from available child profiles to view personalized recommendations
2. **View Recommendations**: See top 6 recommended activities based on the child's specific needs
3. **Browse All Activities**: Filter activities by category (Social, Behavioral, Emotional) or view all
4. **Activity Details**: Click on any activity card to view detailed information including:
   - Full description
   - Required materials
   - Duration and difficulty level
   - Age range
   - Specific benefits

## 🎨 Features Overview

### Recommendation Algorithm
The system uses a sophisticated scoring algorithm that considers:
- Child's needs level (high/medium/low) for each category
- Child's preferences (visual, structured, movement, etc.)
- Activity difficulty matching child's capabilities
- Age appropriateness
- Specific challenges addressed by each activity

### Activity Categories

**Social Activities** (Blue theme)
- Social story reading
- Role-playing games
- Group circle time
- Peer buddy systems

**Behavioral Activities** (Orange theme)
- Visual schedule routines
- Calm down corners
- Token reward systems
- Sensory break activities

**Emotional Activities** (Green theme)
- Emotion identification
- Feelings journals
- Mindfulness breathing
- Empathy building stories

## 🔧 API Endpoints

- `GET /api/children` - Get all child profiles
- `GET /api/children/:id` - Get specific child profile
- `GET /api/activities` - Get all activities (optional `?category=social` filter)
- `GET /api/activities/:id` - Get specific activity details
- `GET /api/recommendations/:childId` - Get personalized recommendations for a child
- `GET /api/categories` - Get all activity categories

## 🎯 Future Enhancements

- User authentication for caregivers and therapists
- Progress tracking and activity completion logging
- Custom child profile creation
- Activity customization and notes
- Integration with therapy session scheduling
- Analytics and progress reports

## 📝 License

ISC

## 💝 Contributing

This is a research project for 4th year studies. Contributions and feedback are welcome!

## 🙏 Acknowledgments

Built with care for caregivers and therapists supporting children with autism spectrum disorder.