import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { Form, Input, Button, Card, message, Tabs, Checkbox, Typography, Modal, Alert, Row, Col, Space, Divider } from 'antd';
import { MailOutlined, LockOutlined, PhoneOutlined, EnvironmentOutlined, WarningOutlined } from '@ant-design/icons';
import logo from '../assets/melfa-logo.png';

const { TabPane } = Tabs;
const { Text } = Typography;

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const handleLogin = async (values: { email: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      await setPersistence(auth, values.remember ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        message.error('Lütfen email adresinizi doğrulayın!');
        setVerificationEmailSent(true);
        return;
      }

      message.success('Giriş başarılı!');
      onLoginSuccess();
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message.error('Email veya şifre hatalı!');
      } else {
        message.error('Giriş yapılırken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; passwordConfirm: string; kvkk: boolean }) => {
    if (values.password !== values.passwordConfirm) {
      message.error('Şifreler eşleşmiyor!');
      return;
    }

    if (!values.kvkk) {
      message.error('KVKK metnini onaylamanız gerekiyor!');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      setVerificationEmailSent(true);
      message.success('Kayıt başarılı! Lütfen email adresinizi doğrulayın.');
      
      await signOut(auth);
      
      form.resetFields();
      const tabs = document.querySelector('.ant-tabs-nav-list');
      if (tabs) {
        const loginTab = tabs.children[0] as HTMLElement;
        loginTab.click();
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        message.error('Bu email adresi zaten kullanımda!');
      } else if (error.code === 'auth/invalid-email') {
        message.error('Geçersiz email adresi!');
      } else if (error.code === 'auth/weak-password') {
        message.error('Şifre çok zayıf! En az 6 karakter kullanın.');
      } else {
        message.error('Kayıt olurken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        message.success('Doğrulama emaili tekrar gönderildi!');
      } catch (error) {
        message.error('Doğrulama emaili gönderilemedi!');
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(to right, #ece9e6, #ffffff)',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '90%', 
        maxWidth: '900px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', 
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <Row gutter={0} style={{ minHeight: '500px' }}>
          <Col xs={24} md={12} style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            textAlign: 'center',
            color: 'white',
            position: 'relative'
          }}>
            <img src={logo} alt="Melfa Oto Logo" style={{ height: '120px', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>MELFA OTO YEDEK PARÇA</h2>
            <p style={{ fontSize: '18px', lineHeight: '1.5' }}>Aracınız için kaliteli ve güvenilir yedek parçalarınız burada!</p>
          </Col>

          <Col xs={24} md={12} style={{ 
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>İletişim Bilgileri</h3>
                <Space direction="vertical" size={12} style={{ width: '100%', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <PhoneOutlined style={{ fontSize: '20px', color: '#dc2626', marginRight: '10px' }} />
                    <Text style={{ fontSize: '16px', color: '#555' }}>0541 632 2634</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <MailOutlined style={{ fontSize: '20px', color: '#dc2626', marginRight: '10px' }} />
                    <Text style={{ fontSize: '16px', color: '#555' }}>info@melfaotoyedekparca.com.tr</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left' }}>
                    <EnvironmentOutlined style={{ fontSize: '20px', color: '#dc2626', marginRight: '10px', paddingTop: '2px' }} />
                    <Text style={{ fontSize: '16px', color: '#555' }}>Fevzipaşa Mah. 48046 Sk. No:29 Seyhan/Adana</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: 8 }}>
                    <a
                      href="https://wa.me/905416322634?text=Merhaba%2C%20yedek%20par%C3%A7a%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: '#25D366', borderRadius: '50%', width: 28, height: 28, justifyContent: 'center', marginRight: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.828-2.05C13.416 27.168 14.684 27.5 16 27.5c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.18 0-2.332-.207-3.418-.615l-.244-.09-4.646 1.217 1.24-4.527-.16-.234C7.207 18.332 7 17.18 7 16c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.29-7.71c-.29-.145-1.715-.848-1.98-.945-.266-.098-.46-.145-.655.145-.195.29-.75.945-.92 1.14-.17.195-.34.22-.63.073-.29-.145-1.225-.452-2.334-1.44-.862-.77-1.444-1.72-1.615-2.01-.17-.29-.018-.447.127-.592.13-.13.29-.34.435-.51.145-.17.193-.29.29-.485.097-.195.048-.365-.024-.51-.073-.145-.655-1.58-.897-2.17-.237-.57-.48-.492-.655-.5-.17-.007-.365-.01-.56-.01-.195 0-.51.073-.78.365-.27.29-1.02.995-1.02 2.425 0 1.43 1.04 2.81 1.185 3.005.145.195 2.05 3.13 5.07 4.27.71.244 1.263.39 1.695.5.712.18 1.36.155 1.87.094.57-.067 1.715-.7 1.96-1.38.24-.68.24-1.265.17-1.38-.07-.115-.26-.18-.55-.325z"/>
                        </svg>
                      </span>
                      <Text style={{ fontSize: '16px', color: '#25D366', fontWeight: 500 }}>WhatsApp ile yaz</Text>
                    </a>
                  </div>
                </Space>
                <Divider style={{ margin: '30px 0' }}>Veya</Divider>
              </div>

              {verificationEmailSent && (
                <Alert
                  message="Email Doğrulama Gerekli"
                  description={
                    <div>
                      <p>Email adresinize bir doğrulama linki gönderdik.</p>
                      <p>Lütfen email kutunuzu kontrol edin ve hesabınızı doğrulayın.</p>
                      <p>Email gelmedi mi? <Button type="link" onClick={handleResendVerification}>Tekrar gönder</Button></p>
                    </div>
                  }
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16 }}
                />
              )}
              <Tabs defaultActiveKey="login" centered>
                <TabPane tab="Giriş Yap" key="login">
                  <Form
                    name="login"
                    onFinish={handleLogin}
                    layout="vertical"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Lütfen email adresinizi girin!' },
                        { type: 'email', message: 'Geçerli bir email adresi girin!' }
                      ]}
                    >
                      <Input 
                        prefix={<MailOutlined />} 
                        placeholder="Email" 
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Şifre"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item name="remember" valuePropName="checked" initialValue={false}>
                      <Checkbox>Beni Hatırla</Checkbox>
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        block
                        size="large"
                        className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                      >
                        Giriş Yap
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                <TabPane tab="Kayıt Ol" key="register">
                  <Form
                    form={form}
                    name="register"
                    onFinish={handleRegister}
                    layout="vertical"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Lütfen email adresinizi girin!' },
                        { type: 'email', message: 'Geçerli bir email adresi girin!' }
                      ]}
                    >
                      <Input 
                        prefix={<MailOutlined />} 
                        placeholder="Email" 
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: 'Lütfen şifrenizi girin!' },
                        { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' },
                        { 
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
                          message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir!'
                        }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Şifre"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="passwordConfirm"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Lütfen şifrenizi tekrar girin!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Şifre Tekrar"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="kvkk"
                      valuePropName="checked"
                      rules={[
                        { 
                          validator: (_, value) =>
                            value ? Promise.resolve() : Promise.reject(new Error('KVKK metnini onaylamanız gerekiyor!')),
                        },
                      ]}
                    >
                      <Checkbox>
                        <Text type="secondary">
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', padding: 0, color: '#1677ff', textDecoration: 'underline', cursor: 'pointer' }} 
                            onClick={(e) => {
                              e.preventDefault();
                              Modal.info({
                                title: 'KVKK Aydınlatma Metni',
                                width: 600,
                                content: (
                                  <div>
                                    <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Melfa Oto Yedek Parça olarak kişisel verilerinizin güvenliği konusunda azami hassasiyet göstermekteyiz.</p>
                                    <p>Kişisel verileriniz, aşağıdaki amaçlar doğrultusunda işlenebilecektir:</p>
                                    <ul>
                                      <li>Hizmetlerimizin sunulması ve geliştirilmesi</li>
                                      <li>Müşteri ilişkileri yönetimi</li>
                                      <li>Yasal yükümlülüklerimizin yerine getirilmesi</li>
                                      <li>Güvenlik ve dolandırıcılık önleme</li>
                                    </ul>
                                    <p>Kişisel verileriniz, yasal yükümlülüklerimiz dışında, açık rızanız olmaksızın üçüncü kişilerle paylaşılmayacaktır.</p>
                                    <p>KVKK kapsamında haklarınız hakkında detaylı bilgi için lütfen bizimle iletişime geçin.</p>
                                  </div>
                                ),
                              });
                            }}
                          >
                            KVKK metnini okudum ve onaylıyorum
                          </button>
                        </Text>
                      </Checkbox>
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        block
                        size="large"
                        className="bg-red-600 hover:bg-red-700 !rounded-button whitespace-nowrap"
                      >
                        Kayıt Ol
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>
              </Tabs>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Login; 