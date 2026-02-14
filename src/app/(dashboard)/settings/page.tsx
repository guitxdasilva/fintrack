"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Loader2,
  User,
  Lock,
  Save,
  Trash2,
  Calendar,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/common/components/ui/dialog";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
});

type ProfileFieldErrors = Partial<Record<"name" | "email", string>>;

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFieldErrors, setProfileFieldErrors] =
    useState<ProfileFieldErrors>({});

  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name);
          setEmail(data.email);
          setCreatedAt(data.createdAt);
        }
      } catch {
        toast.error("Erro ao carregar perfil");
      } finally {
        setInitialLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFieldErrors({});

    const result = profileSchema.safeParse({ name, email });

    if (!result.success) {
      const errors: ProfileFieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProfileFieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      });
      setProfileFieldErrors(errors);
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.data.name, email: result.data.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao atualizar perfil");
        return;
      }

      setName(data.name);
      setEmail(data.email);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Email não encontrado");
      return;
    }

    setPasswordResetLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        toast.error("Erro ao enviar email de redefinição");
        return;
      }

      setPasswordResetSent(true);
      toast.success("Email de redefinição enviado!");
    } catch {
      toast.error("Erro ao enviar email de redefinição");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir conta");
        return;
      }

      toast.success("Conta excluída com sucesso");
      signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Erro ao excluir conta");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Profile Section */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <User className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleProfileSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className={profileFieldErrors.name ? "border-destructive" : ""}
              />
              {profileFieldErrors.name && (
                <p className="text-xs text-destructive">
                  {profileFieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={
                  profileFieldErrors.email ? "border-destructive" : ""
                }
              />
              {profileFieldErrors.email && (
                <p className="text-xs text-destructive">
                  {profileFieldErrors.email}
                </p>
              )}
            </div>

            {createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Conta criada em{" "}
                  {new Date(createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar alterações
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Password Section */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>
                Enviaremos um link para seu email para redefinir a senha
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {passwordResetSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Email enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada em <strong>{email}</strong> para
                  redefinir sua senha.
                </p>
                <p className="text-xs text-muted-foreground">
                  Não encontrou? Verifique a pasta de <strong>spam</strong>.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setPasswordResetSent(false)}
              >
                Enviar novamente
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">Redefinir via email</p>
                  <p className="text-xs text-muted-foreground">
                    Um link será enviado para <strong>{email}</strong>
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePasswordReset}
                disabled={passwordResetLoading}
                size="sm"
              >
                {passwordResetLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviar link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Zona de perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis para sua conta
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-sm">Excluir conta</p>
              <p className="text-xs text-muted-foreground">
                Todos os seus dados serão permanentemente removidos
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir conta permanentemente?</DialogTitle>
                  <DialogDescription>
                    Esta ação é irreversível. Todos os seus dados (transações,
                    categorias, metas, cartões) serão permanentemente excluídos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Digite{" "}
                      <span className="font-bold text-destructive">
                        EXCLUIR
                      </span>{" "}
                      para confirmar
                    </label>
                    <Input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="EXCLUIR"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirm("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteConfirm !== "EXCLUIR" || deleteLoading}
                      onClick={handleDeleteAccount}
                    >
                      {deleteLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Excluir permanentemente
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
