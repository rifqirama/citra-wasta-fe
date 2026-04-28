import { useEffect, useState, useRef } from "react";
import { useWastra } from "../context/WastraContext";
import { userService, uploadService } from "../api/api";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/elements/button";
import { Card } from "../components/elements/card";
import { Skeleton } from "../components/elements/skeleton";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  profilePicture: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  hasPassword?: boolean;
}

const Profile = () => {
  const { user, setUser } = useWastra();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setNameValue(profile.name || "");
    }
  }, [profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userService.getProfile();
      if (res.data && res.data.success) {
        const userData = res.data.user;
        setProfile(userData as UserProfile);
        
        if (setUser && user) {
          setUser({ 
            ...user, 
            name: userData.name || user.name,
            email: userData.email || user.email,
            profilePicture: userData.profilePicture || null,
          });
        }
        
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const userDataLocal = JSON.parse(savedUser);
          userDataLocal.name = userData.name || userDataLocal.name;
          userDataLocal.email = userData.email || userDataLocal.email;
          userDataLocal.profilePicture = userData.profilePicture || null;
          localStorage.setItem("user", JSON.stringify(userDataLocal));
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (nameValue.trim() === (profile?.name || "")) {
      return;
    }

    setSavingName(true);
    try {
      const res = await userService.updateProfile(nameValue.trim() || undefined);
      if (res.data && res.data.success) {
        const updatedUser = res.data.user;
        setProfile((prev) => (prev ? { 
          ...prev, 
          name: updatedUser.name,
          profilePicture: updatedUser.profilePicture || prev.profilePicture,
        } : null));
        
        if (setUser && user) {
          setUser({ 
            ...user, 
            name: updatedUser.name,
            profilePicture: updatedUser.profilePicture || user.profilePicture,
          });
        }

        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.name = updatedUser.name;
          userData.profilePicture = updatedUser.profilePicture || userData.profilePicture;
          localStorage.setItem("user", JSON.stringify(userData));
        }

        toast.success("Name updated successfully");
        
        setTimeout(() => {
          fetchProfile();
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update name");
      setNameValue(profile?.name || "");
    } finally {
      setSavingName(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await uploadService.upload(formData);
      const imageUrl = uploadRes.data.imageUrl;

      const updateRes = await userService.updateProfilePicture(imageUrl);
      if (updateRes.data && updateRes.data.success) {
        const updatedProfilePicture = updateRes.data.user?.profilePicture || imageUrl;
        
        setProfile((prev) => (prev ? { ...prev, profilePicture: updatedProfilePicture } : null));
        
        if (setUser && user) {
          setUser({ ...user, profilePicture: updatedProfilePicture });
        }

        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.profilePicture = updatedProfilePicture;
          localStorage.setItem("user", JSON.stringify(userData));
        }

        toast.success("Profile picture updated successfully");
        
        setTimeout(() => {
          fetchProfile();
        }, 500);
      } else {
        toast.error("Failed to update profile picture: Invalid response from server");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile?.hasPassword === true && !passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error("Password must include at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    setSavingPassword(true);
    try {
      const currentPassword = profile?.hasPassword === false ? undefined : passwordForm.currentPassword;
      
      await userService.changePassword(currentPassword, passwordForm.newPassword);
      
      toast.success("Password has been changed successfully", {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10b981',
        },
      });
      setProfile((prev) => (prev ? { ...prev, hasPassword: true } : null));
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to change password";
      if (errorMessage.toLowerCase().includes("current password is incorrect") || 
          (errorMessage.toLowerCase().includes("current password") && errorMessage.toLowerCase().includes("incorrect"))) {
        toast.error("Current password is incorrect", {
          duration: 3000,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        });
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Please try logging in again.", {
          duration: 3000,
        });
      } else {
        toast.error(errorMessage, {
          duration: 3000,
        });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const getUserInitial = (name?: string | null, email?: string) => {
    return name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "U";
  };

  const getProfilePictureUrl = () => {
    if (profile?.profilePicture) {
      // Ensure URL is absolute (starts with http:// or https://)
      // If it's a relative URL, make it absolute using the API base URL
      const url = profile.profilePicture;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // If it's a relative path, prepend the API base URL
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-64 border border-gray-200 dark:border-gray-700 rounded-xl" />
          <Skeleton className="h-96 border border-gray-200 dark:border-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Profile Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your account settings and profile information
          </p>
        </div>

        {/* Profile Picture Section */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-none mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profile picture</h2>
          <div className="flex items-start gap-6">
            <div className="relative inline-block shrink-0">
              {getProfilePictureUrl() ? (
                <img
                  src={getProfilePictureUrl()!}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <span className="text-white text-2xl font-bold">
                    {getUserInitial(profile?.name, profile?.email)}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white text-xs font-medium px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "..." : "Edit"}
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateName();
                    }
                  }}
                  disabled={savingName}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
                             outline-none transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md 
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             cursor-not-allowed text-sm"
                  placeholder="Email"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleUpdateName}
                  disabled={savingName || nameValue.trim() === (profile?.name || "")}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 h-auto"
                >
                  {savingName ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Section */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-none">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          {profile?.hasPassword === false ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              You signed up with Google and don't have a password yet. Set a password below to enable email/password login.
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Update your password. Enter your current password below.
            </p>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {profile?.hasPassword === true && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
                               outline-none transition pr-10 text-sm"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
                             outline-none transition pr-10 text-sm"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Must include at least one uppercase letter, one lowercase letter, and one number
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 
                             outline-none transition pr-10 text-sm"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? "Saving..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

