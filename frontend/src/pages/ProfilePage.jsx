import CalendarEvents from "../components/CalendarEvents";

const ProfilePage = ({ userData, onLogout }) => {
    return (
        <>
            <div className="w-11/12 mx-auto border-2 backdrop-blur-sm">
                <div className="mt-4 text-center">
                    <h2 className="text-2xl font-semibold">
                        {userData?.first_name} {userData?.last_name}
                    </h2>
                </div>

                <div className="mt-6 w-full">
                    <CalendarEvents />
                </div>
            </div>
        </>
    );
}

export default ProfilePage;
