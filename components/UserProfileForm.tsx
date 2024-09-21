"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters."
    }),
    email: z.string().email({
        message: "Please enter a valid email address."
    }),
    bio: z
        .string()
        .max(160, {
            message: "Bio must not exceed 160 characters."
        })
        .nullable()
})

export default function UserProfileForm() {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            bio: ""
        }
    })

    useEffect(() => {
        const fetchUserProfile = async () => {
            setIsLoading(true)
            try {
                const response = await fetch("/api/users/profile")
                if (response.ok) {
                    const userData = await response.json()
                    form.reset({
                        username: userData.username,
                        email: userData.email,
                        bio: userData.bio || ""
                    })
                } else {
                    throw new Error("Failed to fetch user profile")
                }
            } catch (error) {
                console.error("Error fetching user profile:", error)
                toast({
                    title: "Error",
                    description: "Failed to load user profile",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserProfile()
    }, [form, toast])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(values)
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Your profile has been updated"
                })
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            toast({
                title: "Error",
                description: "Failed to update your profile",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                        <AvatarImage
                            src="/path-to-avatar-image.jpg"
                            alt="User avatar"
                        />
                        <AvatarFallback>
                            {form.getValues("username").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            Edit Profile
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Update your personal information
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 w-full"
                    >
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="johndoe"
                                            {...field}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is your public display name.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="john@example.com"
                                            {...field}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Your email address for notifications.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about yourself"
                                            {...field}
                                            className="w-full"
                                            rows={4}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A brief description about yourself (max
                                        160 characters).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? "Updating..." : "Update Profile"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
