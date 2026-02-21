"use client";

import { useActionState } from "react";
import { updateDisplayName } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export function SettingsForm() {
  const { userProfile, refreshProfile } = useAuth();
  const [state, formAction, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateDisplayName(prev, formData);
      if (result?.success) await refreshProfile();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          placeholder="Enter your display name"
          defaultValue={userProfile?.display_name ?? ""}
          key={userProfile?.display_name}
          required
        />
        <p className="text-xs text-sobek-green-light/60">
          This is how you appear to others on Sobek.
        </p>
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? "Saving..." : "Save"}
      </Button>

      {state?.success && (
        <p className="text-sm text-sobek-gold">Display name updated.</p>
      )}
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
