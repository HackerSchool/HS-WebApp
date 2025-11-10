import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getMemberByUsername, updateMember, uploadMemberImage, getMemberImage } from "../../services/memberService";
import { authAPI } from "../../services/apiService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import "./Profile.css";

const UserProfile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState({});
    const [userTeams, setUserTeams] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [logoUrl, setLogoUrl] = useState(null);
    
    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    const fetchUserData = useCallback(async () => {
        try {
            const data = await getMemberByUsername(user.username);
            
            // Parse extra field for social media links
            let extraData = {};
            if (data.extra) {
                try {
                    extraData = JSON.parse(data.extra);
                } catch (e) {
                    console.warn("Failed to parse extra field:", e);
                }
            }
            
            // Merge social media data from extra field
            const profileDataWithSocial = {
                ...data,
                linkedinUrl: extraData.linkedin || "",
                githubUsername: extraData.github || "",
                discordUsername: extraData.discord || ""
            };
            
            setProfileData(profileDataWithSocial);
        } catch (error) {
            console.error("Error fetching user data:", error);
            setMessage("Error loading profile data");
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    const fetchUserTeams = useCallback(async () => {
        try {
            // Fetch user's participations to get their teams
            const { getMemberParticipations } = await import('../../services/projectParticipationService');
            const participations = await getMemberParticipations(user.username);
            
            // Extract team names from participations
            const teams = participations.map(p => ({
                name: p.project_name,
                isCoordinator: p.roles && p.roles.includes('coordinator')
            }));
            
            setUserTeams(teams);
        } catch (error) {
            console.error("Error fetching user teams:", error);
            setUserTeams([]);
        }
    }, [user?.username]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            // Prepare data for API - move social media to extra field
            const apiData = {
                name: profileData.name,
                email: profileData.email,
                course: profileData.course,
                ist_id: profileData.ist_id,
                join_date: profileData.join_date,
                description: profileData.description,
                extra: JSON.stringify({
                    linkedin: profileData.linkedinUrl || "",
                    github: profileData.githubUsername || "",
                    discord: profileData.discordUsername || ""
                })
            };

            await updateMember(user.username, apiData);
            setMessage("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            setMessage("");

            // Upload image to API
            await uploadMemberImage(user.username, file);
            
            // Refresh the image display
            await fetchUserLogo();
            
            setMessage("Profile picture uploaded successfully!");
        } catch (error) {
            console.error("Error uploading logo:", error);
            setMessage("Error uploading profile picture");
        } finally {
            setSaving(false);
        }
    };

    const fetchUserLogo = useCallback(async () => {
        try {
            const imageBlob = await getMemberImage(user.username);
            const imageUrl = URL.createObjectURL(imageBlob);
            setLogoUrl(imageUrl);
        } catch (error) {
            console.error("Error fetching user logo:", error);
            setLogoUrl(null);
        }
    }, [user?.username]);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        // Validation
        if (!passwordData.currentPassword) {
            setPasswordMessage('Error: Current password is required');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage('Error: New password must be at least 6 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage('Error: New passwords do not match');
            return;
        }

        try {
            setSaving(true);
            
            // First verify current password by attempting login
            try {
                await authAPI.login(user.username, passwordData.currentPassword);
            } catch (error) {
                setPasswordMessage('Error: Current password is incorrect');
                setSaving(false);
                return;
            }
            
            // If current password is correct, update to new password
            await updateMember(user.username, {
                password: passwordData.newPassword
            });

            setPasswordMessage('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsChangingPassword(false);
            
            // Re-login with new password to maintain session
            setTimeout(() => {
                setPasswordMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordMessage(`Error changing password: ${error.response?.data?.description || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const cancelPasswordChange = () => {
        setIsChangingPassword(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordMessage('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    useEffect(() => {
        if (user?.username) {
            fetchUserData();
            fetchUserLogo();
        }
    }, [user?.username, fetchUserData, fetchUserLogo]);

    // Fetch teams when profile data changes
    useEffect(() => {
        fetchUserTeams();
    }, [fetchUserTeams]);

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>User Profile</h2>

                {message && (
                    <div
                        className={`alert ${
                            message.includes("Error")
                                ? "alert-error"
                                : "alert-success"
                        }`}
                    >
                        {message}
                    </div>
                )}

                <div className="profile-header">
                    <div className="profile-logo">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Profile"
                                className="user-logo"
                            />
                        ) : (
                            <div className="user-logo-placeholder">
                                <span>No Picture</span>
                            </div>
                        )}
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={saving}
                            style={{ display: "none" }}
                        />
                        <label
                            htmlFor="logo-upload"
                            className="btn btn-secondary upload-btn"
                        >
                            {saving ? "Uploading..." : "Upload Profile Picture"}
                        </label>
                    </div>

                    <div className="profile-info">
                        <h3>{profileData.name || user?.username}</h3>
                        <p className="username">@{user?.username}</p>
                        {profileData.roles && (
                            <p className="roles">
                                Roles: {profileData.roles.join(", ")}
                            </p>
                        )}
                        {profileData.memberNumber && (
                            <p className="member-number">
                                Member #{profileData.memberNumber}
                            </p>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={profileData.name || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={profileData.email || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="course">Course</label>
                            <input
                                type="text"
                                id="course"
                                name="course"
                                value={profileData.course || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="team">Teams</label>
                            <div className="teams-display">
                                {userTeams && userTeams.length > 0 ? (
                                    userTeams.map((team) => (
                                        <span
                                            key={team.name}
                                            className="team-badge"
                                            title={team.isCoordinator ? 'Coordinator' : 'Member'}
                                        >
                                            {team.name}
                                            {team.isCoordinator && ' 👑'}
                                        </span>
                                    ))
                                ) : (
                                    <span className="no-teams">
                                        No teams assigned
                                    </span>
                                )}
                            </div>
                            <small className="form-help">
                                Teams are managed by administrators
                            </small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ist_id">IST ID</label>
                            <input
                                type="text"
                                id="ist_id"
                                name="ist_id"
                                value={profileData.ist_id || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="join_date">Join Date</label>
                            <input
                                type="date"
                                id="join_date"
                                name="join_date"
                                value={profileData.join_date || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                            />
                        </div>
                    </div>


                    {/* Social Media Section - moved to extra field */}
                    <div className="social-media-section">
                        <h4>🔗 Social Links</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="linkedinUrl">
                                    <svg
                                        className="social-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    LinkedIn
                                </label>
                                <input
                                    type="url"
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    value={profileData.linkedinUrl || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing || saving}
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="githubUsername">
                                    <svg
                                        className="social-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </label>
                                <input
                                    type="text"
                                    id="githubUsername"
                                    name="githubUsername"
                                    value={profileData.githubUsername || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing || saving}
                                    placeholder="yourusername"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="discordUsername">
                                <svg
                                    className="social-icon"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
                                </svg>
                                Discord
                            </label>
                            <input
                                type="text"
                                id="discordUsername"
                                name="discordUsername"
                                value={profileData.discordUsername || ""}
                                onChange={handleChange}
                                disabled={!isEditing || saving}
                                placeholder="username#1234"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={profileData.description || ""}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            rows="4"
                            placeholder="Tell us about yourself, your interests, and expertise..."
                        />
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button
                                    type="submit"
                                    className="btn btn-secondary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchUserData(); // Reset to original data
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : null}
                    </div>
                </form>

                {!isEditing && (
                    <div className="profile-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                )}

                {/* Change Password Section */}
                <div className="profile-security-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4>🔒 Security Settings</h4>
                        {!isChangingPassword && !isEditing && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsChangingPassword(true)}
                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                            >
                                Change Password
                            </button>
                        )}
                    </div>

                    {isChangingPassword && (
                        <>
                            {passwordMessage && (
                                <div className={`alert ${passwordMessage.includes('Error') || passwordMessage.includes('required') || passwordMessage.includes('do not match') ? 'alert-error' : 'alert-success'}`}>
                                    {passwordMessage}
                                </div>
                            )}
                            
                            <form onSubmit={handlePasswordSubmit} className="password-form">
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            disabled={saving}
                                            required
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            disabled={saving}
                                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                            tabIndex="-1"
                                            style={{
                                                position: 'absolute',
                                                right: '0.75rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                padding: '0.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                outline: 'none'
                                            }}
                                        >
                                            <FontAwesomeIcon 
                                                icon={showCurrentPassword ? faEyeSlash : faEye}
                                                style={{ fontSize: '1rem' }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                id="newPassword"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                disabled={saving}
                                                required
                                                minLength={6}
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                disabled={saving}
                                                aria-label={showNewPassword ? "Hide password" : "Show password"}
                                                tabIndex="-1"
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    padding: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    outline: 'none'
                                                }}
                                            >
                                                <FontAwesomeIcon 
                                                    icon={showNewPassword ? faEyeSlash : faEye}
                                                    style={{ fontSize: '1rem' }}
                                                />
                                            </button>
                                        </div>
                                        <small className="form-help">Minimum 6 characters</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm New Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                disabled={saving}
                                                required
                                                minLength={6}
                                                style={{ paddingRight: '2.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={saving}
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                tabIndex="-1"
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    padding: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    outline: 'none'
                                                }}
                                            >
                                                <FontAwesomeIcon 
                                                    icon={showConfirmPassword ? faEyeSlash : faEye}
                                                    style={{ fontSize: '1rem' }}
                                                />
                                            </button>
                                        </div>
                                        <small className="form-help">
                                            {passwordData.newPassword && passwordData.confirmPassword && 
                                             passwordData.newPassword === passwordData.confirmPassword ? (
                                                <span style={{ color: '#6dba76' }}>✓ Passwords match</span>
                                            ) : passwordData.confirmPassword ? (
                                                <span style={{ color: '#e74c3c' }}>✗ Passwords do not match</span>
                                            ) : (
                                                'Re-enter your new password'
                                            )}
                                        </small>
                                    </div>
                                </div>

                                <div className="form-actions" style={{ marginTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving || passwordData.newPassword !== passwordData.confirmPassword}
                                    >
                                        {saving ? 'Changing Password...' : 'Change Password'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cancelPasswordChange}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {!isChangingPassword && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', margin: '0' }}>
                            Keep your account secure by using a strong password.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
