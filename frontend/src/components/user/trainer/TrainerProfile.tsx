import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Lock,
  LogOut,
  Edit,
  Save,
  X,
  CheckCircle,
  Shield,
  Activity,
  Trophy
} from "lucide-react";

export default function TrainerProfile() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    //@ts-ignore
    const { user, token } = useAppSelector((state) => state.auth);

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
        },
    };

    const [isTrainerProfileEditing, setIsTrainerProfileEditing] = useState(false);
  
return (
    <div>
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white text-2xl">Trainer Profile</CardTitle>
                        <CardDescription>
                        Manage your trainer profile
                        </CardDescription>
                    </div>
                    {!isTrainerProfileEditing && (
                        <Button
                        variant="outline"
                        onClick={() => setIsTrainerProfileEditing(true)}
                        className="border-gray-600"
                        >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Trainer Profile
                        </Button>
                    )}
                </div>
                </CardHeader>
            </Card>
        </motion.div>
    </div>
  );
}