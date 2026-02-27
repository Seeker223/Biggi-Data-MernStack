import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Camera } from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";
import { updateAvatar, updateUserProfile } from "../../services/api";
import { Alert as ModalAlert } from "../../utils/alert";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function EditProfileScreen() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stateValue, setStateValue] = useState("");

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || "");
    setPhone(user.phoneNumber || "");
    setEmail(user.email || "");
    setAvatarPreview(user.photo || "");
    setStateValue(user.state || "");
  }, [user]);

  const userIdShort = useMemo(() => String(user?._id || "").slice(-8), [user?._id]);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadSelectedAvatar = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await updateAvatar(formData);
      const photoUrl = res?.user?.photo || res?.photo || res?.avatar || "";

      if (!res?.success && !photoUrl) {
        throw new Error(res?.msg || "Upload failed");
      }

      if (photoUrl) updateUser({ photo: photoUrl });
      await refreshUser?.();
      setSelectedFile(null);
      ModalAlert.alert("Success", "Avatar updated successfully!");
    } catch (err) {
      ModalAlert.alert("Error", err?.message || "Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    try {
      setLoading(true);
      const res = await updateUserProfile({
        username,
        phoneNumber: phone,
        email,
        state: stateValue,
      });

      if (res?.data?.success) {
        await refreshUser?.();
        ModalAlert.alert("Success", "Profile updated successfully!");
      } else {
        ModalAlert.alert("Error", res?.data?.msg || "Update failed");
      }
    } catch (err) {
      ModalAlert.alert("Error", err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </IconButton>
          <Title>Edit My Profile</Title>
          <Spacer />
        </Header>

        <Content>
          <AvatarWrap>
            <Avatar src={avatarPreview || user?.photo || DEFAULT_AVATAR} alt="Profile avatar" />
            <AvatarPick htmlFor="avatar-input">
              <Camera size={16} />
            </AvatarPick>
            <HiddenInput
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
            />
          </AvatarWrap>
          <Name>{username || "User"}</Name>
          <IdText>ID: {userIdShort}</IdText>

          {selectedFile && (
            <UploadBtn type="button" onClick={uploadSelectedAvatar} disabled={loading}>
              {loading ? "Uploading..." : "Upload Avatar"}
            </UploadBtn>
          )}

          <Section>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />

            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />

            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label>State</Label>
            <Select
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
            >
              <option value="">Select state</option>
              {NIGERIA_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>

            <PrimaryBtn type="button" onClick={submitProfile} disabled={loading}>
              {loading ? "Saving..." : "Update Profile"}
            </PrimaryBtn>
          </Section>
        </Content>
      </Container>
      <FloatingBottomNav />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px 14px 96px;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const IconButton = styled.button`
  border: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
`;

const Spacer = styled.div`
  width: 36px;
`;

const Content = styled.div`
  align-items: center;
  background: #f5f5f5;
  border-top-left-radius: 35px;
  border-top-right-radius: 35px;
  padding-top: 20px;
  display: flex;
  flex-direction: column;
`;

const AvatarWrap = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #000;
  object-fit: cover;
`;

const AvatarPick = styled.label`
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: 2px solid #fff;
  background: #ff7a00;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HiddenInput = styled.input`
  display: none;
`;

const Name = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 10px 0 4px;
  color: #003322;
`;

const IdText = styled.p`
  color: #555;
  margin: 0;
`;

const UploadBtn = styled.button`
  margin-top: 12px;
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: #222;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const Section = styled.div`
  width: 85%;
  margin-top: 22px;
  display: grid;
`;

const Label = styled.label`
  color: #000;
  font-size: 14px;
  margin-top: 14px;
`;

const Input = styled.input`
  background: #d9d9d9;
  border: 0;
  border-radius: 10px;
  padding: 10px;
  margin-top: 5px;
  outline: none;
`;

const Select = styled.select`
  background: #d9d9d9;
  border: 0;
  border-radius: 10px;
  padding: 10px;
  margin-top: 5px;
  outline: none;
`;

const PrimaryBtn = styled.button`
  margin-top: 24px;
  border: 0;
  border-radius: 25px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  padding: 14px;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Abuja",
  "Zamfara",
];

