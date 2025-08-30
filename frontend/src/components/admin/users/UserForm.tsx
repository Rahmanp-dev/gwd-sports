import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import type { User, UserFormData } from '@/types';
import { SPORTS_LIST } from '@/utils/constants';

// Define form validation schema
const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' })
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'trainer', 'student', 'user']),
  sports: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
});

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSubmit, 
  isLoading, 
  onCancel 
}) => {
  const isEditMode = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      phone: user?.phone || '',
      role: user?.role || 'user',
      sports: user?.sports || [],
      isActive: user?.isActive !== undefined ? user.isActive : true
    }
  });
  
  // For sports selection
  const [selectedSports, setSelectedSports] = React.useState<string[]>(
    user?.sports || []
  );

  const handleSportToggle = (sport: string) => {
    setSelectedSports(prev => {
      const isSelected = prev.includes(sport);
      const newSelection = isSelected 
        ? prev.filter(s => s !== sport) 
        : [...prev, sport];
      
      form.setValue('sports', newSelection);
      return newSelection;
    });
  };

  const handleSubmit = (data: UserFormData) => {
    // If password is empty and we're editing, remove it from the data
    if (isEditMode && (!data.password || data.password.trim() === '')) {
      delete data.password;
    }
    
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit User' : 'Create New User'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update user information in the system.' 
            : 'Add a new user to the system.'}
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        disabled={isLoading || isEditMode} // Email can't be changed in edit mode
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={isEditMode ? '••••••••' : 'Create a password'} 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Field */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="user">Regular User</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status Field */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-8">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      User is active
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sports Selection Field - only show if role is trainer or student */}
            {form.watch('role') === 'trainer' || form.watch('role') === 'student' ? (
              <FormField
                control={form.control}
                name="sports"
                render={() => (
                  <FormItem>
                    <FormLabel>Sports</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                      {SPORTS_LIST.map(sport => (
                        <div key={sport} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`sport-${sport}`}
                            checked={selectedSports.includes(sport)}
                            onCheckedChange={() => handleSportToggle(sport)}
                            disabled={isLoading}
                          />
                          <label 
                            htmlFor={`sport-${sport}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {sport}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};