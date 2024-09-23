import React, { useEffect, useState, useCallback } from "react";
import "@/styles/globals.css";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  isAuthenticated,
  getUsername,
  removeCookie,
  getAccessToken,
  getUserId,
  setAccessToken,
  setUserId,
  getCookie,
} from "@/utils/auth";
import {
  Loader2,
  CircleUser,
  Package,
  Mail,
  Phone,
  MessageCircle,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PropertyList02 from "./PropertyList";
import RegionSelector from "./Region";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import RefreshBrowser from "./RefreshBrowser";
import { Loader, Placeholder } from "rsuite";
import UserCredential from "./UserCredential";

const FASTAPI_LOGIN = import.meta.env.PUBLIC_FASTAPI_ENDPOINT;
const homedomain = import.meta.env.PUBLIC_HOME_DOMAIN;

interface UserProfile {
  user_id: number;
  title: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  province_id: string | null;
  district_id: string | null;
  city_id: string | null;
  village_id: string | null;
  gender: "man" | "woman" | null;
  birthday: string | null;
  avatar: string | null;
  remote_url: string | null;
  company_name: string | null;
  biodata_company: string | null;
  jobdesk: string | null;
  social_media: string | null;
  // social_media: {
  //   facebook: string | null;
  //   twitter: string | null;
  //   instagram: string | null;
  //   linkedin: string | null;
  //   youtube: string | null;
  //   tiktok: string | null;
  //   snapchat: string | null;
  //   pinterest: string | null;
  //   reddit: string | null;
  //   zoom: string | null;
  // };
  id: number;
  province: {
    code: string;
    name: string;
    level: string;
  } | null;
  district: {
    code: string;
    name: string;
    level: string;
  } | null;
  city: {
    code: string;
    name: string;
    level: string;
  } | null;
  village: {
    code: string;
    name: string;
    level: string;
  } | null;
}

interface PropertyList {
  user_id: number | null;
  category_id: number | null;
  title: string | null;
  short_desc: string | null;
  description: string | null;
  price: number | null;
  period: string | null;
  address: string | null;
  province_id: string | null;
  district_id: string | null;
  city_id: string | null;
  village_id: string | null;
  coordinates: string | null;
  nearby: string | null;
  ads: string | null;
  status: string | null;
  views_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  id: number | null;
  created_at: string | null;
  updated_at: string | null;
  facility: {
    certificate: string | null;
    electricity: number | null;
    line_phone: string | null;
    internet: string | null;
    road_width: string | null;
    water_source: string | null;
    hook: string | null;
    condition: string | null;
    security: string | null;
    wastafel: string | null;
    id: number;
  };
  specification: {
    land_size: number | null;
    building_size: number | null;
    bedroom: number | null;
    carport: string | null;
    bathroom: number | null;
    dining_room: string | null;
    living_room: string | null;
    floors: number | null;
    id: number;
  };
  images: {
    image_url: string;
    remote_image_url: string | null;
    is_primary: boolean;
    id: number;
  }[];
  province: {
    code: string;
    name: string;
    level: string;
  };
  district: {
    code: string;
    name: string;
    level: string;
  };
  city: {
    code: string;
    name: string;
    level: string;
  };
  village: {
    code: string;
    name: string;
    level: string;
  };
}

interface DashboardProps {
  accessToken?: string;
  userId?: string;
}

interface User {
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  profile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ accessToken, userId }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [tokenFromCookie, setTokenFromCookie] = useState<string | null>(null);
  const [userIdFromCookie, setUserIdFromCookie] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<{
    items: PropertyList[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "properties">(
    "profile"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [alertInfo, setAlertInfo] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [showCreateProfileButton, setShowCreateProfileButton] = useState(false);
  const [profileFetchCompleted, setProfileFetchCompleted] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessTokenFromCookie = getCookie("access_token");
      const userIdFromCookie = getCookie("user_id");

      if (accessTokenFromCookie && userIdFromCookie) {
        setTokenFromCookie(accessTokenFromCookie);
        setUserIdFromCookie(userIdFromCookie);
        setUsername(getUsername() || "User");

        try {
          await Promise.all([
            fetchUserData(userIdFromCookie, accessTokenFromCookie),
            fetchUserProfile(userIdFromCookie, accessTokenFromCookie),
            fetchProperties(accessTokenFromCookie, userIdFromCookie),
          ]);
        } catch (error) {
          console.error("Error initializing auth:", error);
          toast({
            title: "Error",
            description: "Gagal memuat data. Silakan coba lagi.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Peringatan",
          description: "Anda belum login!",
          duration: 3000,
        });
        setTimeout(() => {
          window.location.href = "/loginpage";
        }, 2000);
      }
    };

    initializeAuth();
  }, [toast]);

  const fetchUserData = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${FASTAPI_LOGIN}/users/${userId}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      console.log("Data User yang diambil:", data);
      setUserData(data);
      setUserProfile(data.profile);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pengguna",
        variant: "destructive",
      });
    }
  };

  const fetchProperties = async (token: string, userId: string) => {
    const url = `${FASTAPI_LOGIN}/properties/user/${userId}`;
    console.log("Mengambil properti dari URL:", url);

    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Kesalahan HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data properti yang diambil:", data);
      setProperties(data);
    } catch (error) {
      console.error("Kesalahan saat mengambil properti:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data properti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${FASTAPI_LOGIN}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        console.log("User profile not found, showing create profile button.");
        setUserProfile(null);
        setShowCreateProfileButton(true);
      } else if (response.ok) {
        const data = await response.json();
        console.log("User profile data fetched:", data);
        if (data === null) {
          setUserProfile(null);
          setShowCreateProfileButton(true);
        } else {
          setUserProfile(data);
          setShowCreateProfileButton(false);
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setShowCreateProfileButton(true);
    } finally {
      setProfileFetchCompleted(true);
    }
  };

  const handleLogout = () => {
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "username=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    setUsername("");
    setTokenFromCookie(null);
    setUserIdFromCookie(null);

    toast({
      title: "Logout Successful",
      variant: "warning",
      description: `Good bye, ${username}!`,
    });

    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setPasswordError(
        "Kata sandi baru harus terdiri dari minimal 6 karakter."
      );
      return;
    }

    setIsSaving(true);

    try {
      const accessToken = getAccessToken();
      console.log("access_token:", accessToken);
      console.log("current_password:", currentPassword);
      console.log("new_password:", newPassword);

      const response = await fetch(
        `${import.meta.env.PUBLIC_FASTAPI_ENDPOINT}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      if (response.ok) {
        setAlertInfo({
          type: "success",
          message: "Kata sandi berhasil diubah",
        });
        setIsEditing(false);
        setPasswordError(null);
      } else {
        throw new Error("Gagal mengubah kata sandi");
      }
    } catch (error) {
      setAlertInfo({
        type: "error",
        message: "Gagal mengubah kata sandi. Silakan coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setPasswordError(null);
  };

  const cleanUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${homedomain}/storage/${url}`;
    const cleanedUrl = `${homedomain}/storage/${url.replace(/[",/\\]/g, "")}`;
    console.log("URL gambar yang dibersihkan:", cleanedUrl);
    return cleanedUrl;
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile(userProfile);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    try {
      const token = getAccessToken();
      const userId = getUserId();
      const url = `${FASTAPI_LOGIN}/profile/${userId}`;
      console.log("Mengirim permintaan pembaruan profil:", editedProfile);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: editedProfile.user_id,
          title: editedProfile.title,
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          whatsapp: editedProfile.whatsapp,
          address: editedProfile.address,
          province_id: editedProfile.province?.code,
          district_id: editedProfile.district?.code,
          city_id: editedProfile.city?.code,
          village_id: editedProfile.village?.code,
          gender: editedProfile.gender,
          birthday: editedProfile.birthday,
          avatar: editedProfile.avatar,
          remote_url: editedProfile.remote_url,
          company_name: editedProfile.company_name,
          biodata_company: editedProfile.biodata_company,
          jobdesk: editedProfile.jobdesk,
        }),
      });
      console.log("Respon dari server:", response);

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log("JSON response:", JSON.stringify(updatedProfile, null, 2));
        setUserProfile(updatedProfile);
        setIsEditingProfile(false);
        setAlertInfo({
          type: "success",
          message: "Profil berhasil diperbarui",
        });
      } else {
        const errorData = await response.json();
        console.log("Error JSON response:", JSON.stringify(errorData, null, 2));
        throw new Error("Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setAlertInfo({
        type: "error",
        message: "Gagal memperbarui profil",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile(null);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleRegionChange = useCallback(
    (fieldName: string) => (code: string, name: string) => {
      setEditedProfile((prev) =>
        prev ? { ...prev, [fieldName]: { code, name } } : null
      );
    },
    []
  );

  return (
    <div className="container p-4 mx-auto">
      <div className="flex justify-start mt-6 mb-10 space-x-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Beranda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex flex-col md:flex-row">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex flex-row w-full p-2 mt-2 space-x-2 overflow-x-auto bg-transparent rounded-lg md:p-4 md:mt-6 md:space-x-2 dark:bg-transparent md:overflow-x-visible">
            <TabsTrigger
              value="profile"
              className="flex items-center justify-start px-2 py-1 text-xs text-left text-gray-800 transition-colors duration-200 bg-white md:px-4 md:py-2 md:text-sm lg:text-base hover:bg-yellow-300 dark:hover:bg-yellow-700 dark:text-gray-200 dark:bg-gray-800 whitespace-nowrap"
            >
              <CircleUser className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-3" />
              Profil Pengguna
            </TabsTrigger>
            <TabsTrigger
              value="properties"
              className="flex items-center justify-start px-2 py-1 text-xs text-left text-gray-800 transition-colors duration-200 bg-white md:px-4 md:py-2 md:text-sm lg:text-base hover:bg-yellow-300 dark:hover:bg-yellow-700 dark:text-gray-200 dark:bg-gray-800 whitespace-nowrap"
            >
              <Package className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-3" />
              Daftar Properti
            </TabsTrigger>
          </TabsList>
          <div className="w-full mt-4">
            <TabsContent value="profile">
              {userProfile && (
                <Card className="max-w-full p-4 rounded-lg shadow-lg md:p-6 bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-800 dark:to-purple-900">
                  <CardHeader className="mb-3 md:mb-6">
                    <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
                      <div>
                        <CardTitle className="text-lg font-bold text-blue-800 md:text-2xl dark:text-blue-300">
                          Profil Pengguna
                        </CardTitle>
                        <CardDescription className="text-base font-semibold text-blue-700 md:text-xl dark:text-blue-300">
                          Selamat datang kembali, {userProfile.first_name}{" "}
                          {userProfile.last_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RefreshBrowser className="text-xs md:text-sm" />
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                    {alertInfo && (
                      <Alert
                        variant={
                          alertInfo.type === "success"
                            ? "success"
                            : "destructive"
                        }
                      >
                        <Terminal className="w-4 h-4" />
                        <AlertTitle>
                          {alertInfo.type === "success"
                            ? "Berhasil!"
                            : "Kesalahan!"}
                        </AlertTitle>
                        <AlertDescription>{alertInfo.message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Kolom UserCredential */}
                    <UserCredential
                      userData={userData}
                      isEditing={isEditing}
                      showCurrentPassword={showCurrentPassword}
                      showNewPassword={showNewPassword}
                      currentPassword={currentPassword}
                      newPassword={newPassword}
                      passwordError={passwordError}
                      isSaving={isSaving}
                      setIsEditing={setIsEditing}
                      setCurrentPassword={setCurrentPassword}
                      setNewPassword={setNewPassword}
                      setShowCurrentPassword={setShowCurrentPassword}
                      setShowNewPassword={setShowNewPassword}
                      handleSave={handleSave}
                      handleCancel={handleCancel}
                    />

                    {profileFetchCompleted && !userProfile && (
                      <Button className="mt-4 bg-red-500 hover:bg-blue-600 text-white">
                        Buat Profil Baru
                      </Button>
                    )}

                    {userProfile && (
                      // Tampilkan informasi profil pengguna
                      <div className="p-4 rounded-lg shadow-md md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <h3 className="text-base font-semibold text-blue-700 md:text-lg dark:text-blue-300">
                            Profil
                          </h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-white bg-blue-500 hover:text-gray-200 dark:text-gray-100 md:text-sm hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                              onClick={
                                isEditingProfile
                                  ? handleSaveProfile
                                  : handleEditProfile
                              }
                            >
                              {isEditingProfile ? "Simpan" : "Edit"}
                            </Button>
                            {isEditingProfile && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-white bg-red-500 hover:text-gray-200 dark:text-gray-100 md:text-sm hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-[0.5fr_1.25fr_1.25fr]">
                          <div className="flex flex-col items-start">
                            <Avatar className="w-20 h-20 mb-3 md:w-24 md:h-24 md:mb-4 ring-2 ring-blue-300 dark:ring-blue-600">
                              <AvatarImage
                                src={cleanUrl(userProfile.avatar)}
                                alt={`${userProfile.first_name} ${userProfile.last_name}`}
                              />
                              <AvatarFallback className="text-blue-700 bg-blue-200 dark:bg-blue-700 dark:text-blue-200">
                                {userProfile.first_name
                                  ? userProfile.first_name.charAt(0)
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="space-y-2 md:space-y-3">
                            {isEditingProfile ? (
                              <>
                                <ProfileInput
                                  label="Nama Depan"
                                  name="first_name"
                                  value={editedProfile?.first_name || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Nama Belakang"
                                  name="last_name"
                                  value={editedProfile?.last_name || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Telepon"
                                  name="phone"
                                  value={editedProfile?.phone || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Email"
                                  name="email"
                                  value={editedProfile?.email || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="WhatsApp"
                                  name="whatsapp"
                                  value={editedProfile?.whatsapp || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Alamat"
                                  name="address"
                                  value={editedProfile?.address || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Perusahaan"
                                  name="company_name"
                                  value={editedProfile?.company_name || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Biodata Perusahaan"
                                  name="biodata_company"
                                  value={editedProfile?.biodata_company || ""}
                                  onChange={handleInputChange}
                                />
                                <ProfileInput
                                  label="Deskripsi Pekerjaan"
                                  name="jobdesk"
                                  value={editedProfile?.jobdesk || ""}
                                  onChange={handleInputChange}
                                />

                                {/* Option Select province, district, city,village */}
                                <RegionSelector
                                  selectedProvince={
                                    editedProfile?.province?.code || ""
                                  }
                                  selectedDistrict={
                                    editedProfile?.district?.code || ""
                                  }
                                  selectedCity={editedProfile?.city?.code || ""}
                                  selectedVillage={
                                    editedProfile?.village?.code || ""
                                  }
                                  onProvinceChange={handleRegionChange(
                                    "province"
                                  )}
                                  onDistrictChange={handleRegionChange(
                                    "district"
                                  )}
                                  onCityChange={handleRegionChange("city")}
                                  onVillageChange={handleRegionChange(
                                    "village"
                                  )}
                                />
                              </>
                            ) : (
                              <>
                                <ProfileField
                                  label="Nama"
                                  value={`${userProfile.first_name || ""} ${userProfile.last_name || ""}`}
                                />
                                <ProfileField
                                  label="Telepon"
                                  value={userProfile.phone}
                                />
                                <ProfileField
                                  label="Email"
                                  value={userProfile.email}
                                />
                                <ProfileField
                                  label="WhatsApp"
                                  value={userProfile.whatsapp}
                                />
                                <ProfileField
                                  label="Alamat"
                                  value={userProfile.address}
                                />
                                <ProfileField
                                  label="Jenis Kelamin"
                                  value={
                                    userProfile.gender === "man"
                                      ? "Laki-laki"
                                      : userProfile.gender === "woman"
                                        ? "Perempuan"
                                        : "-"
                                  }
                                />
                                <ProfileField
                                  label="Tanggal Lahir"
                                  value={userProfile.birthday || "-"}
                                />
                              </>
                            )}
                          </div>
                          <div className="space-y-2 md:space-y-3">
                            <ProfileField
                              label="Perusahaan"
                              value={userProfile.company_name}
                            />
                            <ProfileField
                              label="Biodata Perusahaan"
                              value={userProfile.biodata_company}
                            />
                            <ProfileField
                              label="Deskripsi Pekerjaan"
                              value={userProfile.jobdesk}
                            />
                            <ProfileField
                              label="Provinsi"
                              value={userProfile.province?.name || "-"}
                            />
                            <ProfileField
                              label="Kabupaten"
                              value={userProfile.district?.name || "-"}
                            />
                            <ProfileField
                              label="Kota"
                              value={userProfile.city?.name || "-"}
                            />
                            <ProfileField
                              label="Desa"
                              value={userProfile.village?.name || "-"}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">
                    Daftar Properti
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Properti yang Anda miliki
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PropertyList02
                    properties={properties?.items || null}
                    isLoading={isLoading}
                    homedomain={homedomain}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string | null | undefined;
}
const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => (
  <div className="flex justify-between text-xs md:text-sm">
    <span className="font-semibold text-gray-700 dark:text-gray-300">
      {label}:
    </span>
    <span className="text-gray-600 break-all dark:text-gray-400">
      {value || "-"}
    </span>
  </div>
);

interface ProfileInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const ProfileInput: React.FC<ProfileInputProps> = ({
  label,
  name,
  value,
  onChange,
}) => (
  <div className="flex flex-col space-y-1">
    <label
      htmlFor={name}
      className="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <Input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    />
  </div>
);
export default Dashboard;
