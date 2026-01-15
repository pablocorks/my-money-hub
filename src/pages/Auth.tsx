import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, KeyRound, Lock } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in via localStorage
    const isLoggedIn = localStorage.getItem('pimpows_logged_in');
    if (isLoggedIn === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Preencha o login e a senha');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        toast.error('Usuário não encontrado');
        setLoading(false);
        return;
      }

      if (data.password_hash !== password) {
        toast.error('Senha incorreta');
        setLoading(false);
        return;
      }

      // Login successful
      if (data.is_first_login) {
        setIsFirstLogin(true);
        setShowChangePassword(true);
        toast.info('Primeiro acesso! Por favor, altere sua senha.');
      } else {
        localStorage.setItem('pimpows_logged_in', 'true');
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha a nova senha e a confirmação');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ password_hash: newPassword, is_first_login: false })
        .eq('username', username);

      if (error) {
        toast.error('Erro ao alterar a senha');
        setLoading(false);
        return;
      }

      localStorage.setItem('pimpows_logged_in', 'true');
      toast.success('Senha alterada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showChangePassword) {
        handleChangePassword();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">🧸</span>
            </div>
          </div>
          <h1 className="text-5xl font-display font-bold text-primary-foreground mb-4">
            PIMPOWS CONTROL
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Seu controle financeiro pessoal de forma simples, moderna e segura.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground">100%</div>
              <div className="text-primary-foreground/70 text-sm">Privado</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground">Seus</div>
              <div className="text-primary-foreground/70 text-sm">Dados seguros</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-primary-foreground">Fácil</div>
              <div className="text-primary-foreground/70 text-sm">De usar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-2xl">🧸</span>
            </div>
            <span className="text-2xl font-display font-bold text-gradient">PIMPOWS CONTROL</span>
          </div>

          <Card className="border-0 shadow-card">
            <CardHeader className="space-y-1 pb-6 text-center">
              <CardTitle className="text-2xl font-display flex items-center justify-center gap-2">
                {showChangePassword ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                {showChangePassword ? 'Alterar Senha' : 'Bem-vindo!'}
              </CardTitle>
              <CardDescription>
                {showChangePassword
                  ? 'Defina sua nova senha de acesso'
                  : 'Faça login para acessar o sistema'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showChangePassword ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Digite seu usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleLogin}
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity h-12 text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      'Entrando...'
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity h-12 text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      'Salvando...'
                    ) : (
                      <>
                        <KeyRound className="w-5 h-5 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                Sistema exclusivo para uso pessoal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
