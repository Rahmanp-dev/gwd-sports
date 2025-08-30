import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/types';
import { formatDate } from '@/utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserCog, Mail, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ 
  user, 
  onClose, 
  onEdit 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-red-500 hover:bg-red-600';
      case 'trainer': return 'bg-blue-500 hover:bg-blue-600';
      case 'student': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
                <span className="ml-2 flex items-center">
                  {user.isActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Email</span>
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              {user.email}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Phone</span>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              {user.phone || 'Not provided'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Created On</span>
            <p className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              {formatDate(user.createdAt)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <p className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              {formatDate(user.updatedAt)}
            </p>
          </div>
        </div>

        {user.lastLogin && (
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Last Login</span>
            <p className="flex items-center">
              <UserCog className="h-4 w-4 mr-2 text-muted-foreground" />
              {formatDate(user.lastLogin)}
            </p>
          </div>
        )}

        {user.sports && user.sports.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {user.sports.map(sport => (
                  <Badge key={sport} variant="secondary">
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          Edit User
        </Button>
      </CardFooter>
    </Card>
  );
};