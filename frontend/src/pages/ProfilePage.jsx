const ProfilePage = ({ userData, onLogout }) => {
    return (
        <div>
            <h2>{userData?.first_name || 'User'}</h2>
            {userData?.profile_picture && (
                <img
                    src={userData.profile_picture}
                    alt="Profile"
                    className="profile-picture"
                />
            )}
            <div className="user-details">
                <p>{userData?.first_name} {userData?.last_name}</p>
                <p>{userData?.email}</p>
                <p>{userData?.google_id}</p>
            </div>
            <button
                onClick={onLogout}
            >
                Logout
            </button>
        </div>
    );
}

export default ProfilePage;