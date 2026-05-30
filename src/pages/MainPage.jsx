import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PostCreator from '../components/PostCreator'
import PostList from '../components/PostList'
import Profile from './Profile'
import '../App.css'
import '../components/Sidebar.css'
import '../components/PostCreator.css'
import '../components/PostCard.css'
import '../pages/Profile.css'

const MainPage = ({ theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('feed')

  return (
    <div className="main-layout">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />
      <div className="main-content">
        {activeTab === 'feed' ? (
          <>
            <PostCreator />
            <PostList />
          </>
        ) : (
          <Profile />
        )}
      </div>
    </div>
  )
}

export default MainPage
