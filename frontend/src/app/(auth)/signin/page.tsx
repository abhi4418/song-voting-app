"use client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"USER" | "CREATOR">("USER");
    const { login, isLoading } = useAuth();

    async function handleSignIn() {
        const success = await login(email, password, role);
    }

    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                    <CardAction>
                        <Link href="/signup">
                            <Button className="cursor-pointer" variant="link">Sign Up</Button>
                        </Link>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    onChange={(e) => setEmail(e.target.value)}
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                    <Input
                                        onChange={(e) => setPassword(e.target.value)}
                                        id="password"
                                        type="password"
                                        placeholder="********"
                                        required
                                    />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="user"
                                            name="role"
                                            value="USER"
                                            checked={role === "USER"}
                                            onChange={(e) => setRole(e.target.value as "USER" | "CREATOR")}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <Label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            USER
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="creator"
                                            name="role"
                                            value="CREATOR"
                                            checked={role === "CREATOR"}
                                            onChange={(e) => setRole(e.target.value as "USER" | "CREATOR")}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <Label htmlFor="creator" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            CREATOR
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button 
                        onClick={handleSignIn} 
                        type="submit" 
                        className="w-full cursor-pointer"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Login"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
