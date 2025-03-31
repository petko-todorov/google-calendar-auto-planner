import { useState } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import googleLoading from '../assets/google-loading.gif';
// import { userData } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import Tooltip from '@mui/material/Tooltip';


const ProfileImageMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { userData, logout } = useAuth();

    const title = (
        <span className='text-sm text-gray-200'>
            {userData.first_name} {userData.last_name} <br />
            {userData.email}
        </span>
    );

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            {userData.profile_picture && (
                <Tooltip
                    title={title}
                    placement="bottom-start"
                >
                    <img
                        onClick={handleClick}
                        src={userData.profile_picture}
                        alt="Profile"
                        className="w-12 rounded-full object-cover border-2 border-gray-300 shadow-md absolute top-4 right-4 mb-5 select-none cursor-pointer"
                    />
                </Tooltip>
            )}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                className='mt-1'
                disableAutoFocusItem
            >
                <MenuItem
                    onClick={logout}
                >
                    <LogoutIcon className='mr-2' /> Logout
                </MenuItem>
            </Menu>
        </div>
    );
}

export default ProfileImageMenu;