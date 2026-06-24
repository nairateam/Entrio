'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRole } from '@entrio/types';
import {
  Button,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Select,
  toast,
} from '@/components/ui';
import { ROLE_LABELS } from '@/config/navigation';
import { inviteSchema, type InviteInput } from '../schema';
import { useUsersStore } from '../store/use-users-store';

export function InviteUserModal() {
  const isOpen = useUsersStore((s) => s.isInviteOpen);
  const close = useUsersStore((s) => s.closeInvite);
  const invite = useUsersStore((s) => s.invite);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: '', email: '', role: UserRole.HOST, department: '' },
  });

  const onSubmit = async (values: InviteInput) => {
    try {
      await invite(values);
      reset();
    } catch {
      toast.error('Could not invite the user.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open onClose={close} size="md" ariaLabel="Invite user">
      <ModalHeader>
        <ModalTitle>Invite user</ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ModalBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="i-name" required>
              Full name
            </Label>
            <Input id="i-name" error={Boolean(errors.fullName)} {...register('fullName')} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-email" required>
              Email
            </Label>
            <Input id="i-email" type="email" error={Boolean(errors.email)} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="i-role" required>
                Role
              </Label>
              <Select id="i-role" {...register('role')}>
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-dept">Department</Label>
              <Input id="i-dept" {...register('department')} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Send invite
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
