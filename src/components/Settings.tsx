import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Typography, Modal, Alert } from 'antd';
import { auth } from '../firebase';
import { 
  updateProfile, 
  updatePassword, 
  updateEmail, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  signOut 
} from 'firebase/auth';

const { Title } = Typography;
const { confirm } = Modal;

interface SettingsProps {
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  // Set initial form values
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        displayName: user.displayName || '',
        email: user.email || ''
      });
      emailForm.setFieldsValue({
        currentEmail: user.email || ''
      });
    }
  }, [user, profileForm, emailForm]); // Added dependencies to useEffect

  // Reauthenticate user before sensitive operations
  const promptForReauthentication = async (): Promise<boolean> => {
    if (!user || !user.email) { // Ensure user and user.email are not null
      message.error('Kullanıcı oturumu veya email bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return false;
    }

    const currentUser = user;

    return new Promise((resolve) => {
      confirm({
        title: 'Hassas İşlem İçin Tekrar Giriş Yapınız',
        content: (
          <div>
            <p>Bu işlem hassas bir değişiklik gerektiriyor. Lütfen şifrenizi tekrar giriniz.</p>
            <Form
              layout="vertical"
              onFinish={async (values) => {
                try {
                  setLoading(true);
                  const credential = EmailAuthProvider.credential(currentUser.email!, values.password);
                  await reauthenticateWithCredential(currentUser!, credential);
                  message.success('Kimlik doğrulama başarılı.');
                  Modal.destroyAll();
                  resolve(true);
                } catch (error: any) {
                  message.error('Kimlik doğrulama başarısız: ' + error.message);
                  resolve(false);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
              >
                <Input.Password placeholder="Şifreniz" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>Doğrula</Button>
            </Form>
          </div>
        ),
        icon: null,
        okText: null,
        cancelText: null,
        maskClosable: false,
        closable: false,
      });
    });
  };

  // Update Profile (Display Name)
  const handleUpdateProfile = async (values: { displayName: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName: values.displayName });
      message.success('Profil başarıyla güncellendi!');
    } catch (error: any) {
      message.error('Profil güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!user) return;
    if (values.newPassword !== values.confirmPassword) {
      message.error('Yeni şifreler eşleşmiyor!');
      return;
    }

    const reauthenticated = await promptForReauthentication();
    if (!reauthenticated) return;

    setLoading(true);
    try {
      await updatePassword(user, values.newPassword);
      message.success('Şifreniz başarıyla değiştirildi!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error('Şifre değiştirilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Change Email
  const handleChangeEmail = async (values: { newEmail: string }) => {
    if (!user) return;

    const reauthenticated = await promptForReauthentication();
    if (!reauthenticated) return;

    setLoading(true);
    try {
      await updateEmail(user, values.newEmail);
      message.success('E-posta adresiniz başarıyla değiştirildi! Yeni adresinizi doğrulamanız gerekebilir.');
      emailForm.resetFields();
      onLogout(); // Email değiştiği için oturumu kapatıp tekrar giriş yapmasını iste
    } catch (error: any) {
      message.error('E-posta değiştirilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!user) return;

    confirm({
      title: 'Hesabınızı silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz. Hesabınız kalıcı olarak silinecektir.',
      okText: 'Evet, Sil',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        const reauthenticated = await promptForReauthentication();
        if (!reauthenticated) return;

        setLoading(true);
        try {
          await deleteUser(user);
          message.success('Hesabınız başarıyla silindi.');
          onLogout(); // Hesap silindiği için çıkış yap
        } catch (error: any) {
          message.error('Hesap silinirken hata oluştu: ' + error.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      window.localStorage.clear();
      window.sessionStorage.clear();
      if (window.indexedDB) {
        try {
          window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
        } catch (e) {}
      }
      message.success('Başarıyla çıkış yapıldı.');
      onLogout();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      message.error('Çıkış yapılırken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Hesap Ayarları</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Profile Settings Card */}
        <Card title="Profil Bilgileri" style={{ width: '100%' }}>
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{ displayName: user?.displayName || '' }}
          >
            <Form.Item label="Görünen Ad" name="displayName">
              <Input placeholder="Adınız Soyadınız" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap">
                Profili Güncelle
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Change Password Card */}
        <Card title="Şifre Değiştir" style={{ width: '100%' }}>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              label="Yeni Şifre"
              name="newPassword"
              rules={[{ required: true, message: 'Lütfen yeni şifrenizi girin!' }, { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }]}
            >
              <Input.Password placeholder="Yeni Şifre" />
            </Form.Item>
            <Form.Item
              label="Yeni Şifre Tekrar"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Lütfen yeni şifrenizi tekrar girin!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Yeni şifreler eşleşmiyor!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Yeni Şifre Tekrar" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap">
                Şifreyi Değiştir
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Change Email Card */}
        <Card title="E-posta Adresini Değiştir" style={{ width: '100%' }}>
          <Form
            form={emailForm}
            layout="vertical"
            onFinish={handleChangeEmail}
          >
            <Form.Item
              label="Mevcut E-posta Adresi"
              name="currentEmail"
              rules={[{ required: true, message: 'Mevcut e-posta adresinizi girin!' }, { type: 'email', message: 'Geçerli bir e-posta adresi girin!' }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Yeni E-posta Adresi"
              name="newEmail"
              rules={[{ required: true, message: 'Lütfen yeni e-posta adresinizi girin!' }, { type: 'email', message: 'Geçerli bir e-posta adresi girin!' }]}
            >
              <Input placeholder="Yeni E-posta" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap">
                E-postayı Değiştir
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Account Actions Card */}
        <Card title="Hesap İşlemleri" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Hesabınızı silmek kalıcı bir işlemdir. Tüm verileriniz silinecektir."
              type="warning"
              showIcon
            />
            <Button type="primary" danger onClick={handleDeleteAccount} loading={loading} block className="!rounded-button whitespace-nowrap">
              Hesabı Sil
            </Button>
            <Button type="default" onClick={handleLogout} loading={loading} block className="!rounded-button whitespace-nowrap">
              Çıkış Yap
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default Settings; 