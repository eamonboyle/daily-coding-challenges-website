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
import { LANGUAGE_SLUGS, languages } from "@/lib/languages/registry"

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
        .nullable(),
    preferredLanguageSlug: z.enum(LANGUAGE_SLUGS),
    emailAlerts: z.boolean()
})

type ProfileFormValues = z.infer<typeof formSchema>

export default function UserProfileForm() {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            bio: "",
            preferredLanguageSlug: "typescript",
            emailAlerts: true
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
                        bio: userData.bio || "",
                        preferredLanguageSlug:
                            userData.preferredLanguageSlug || "typescript",
                        emailAlerts: Boolean(userData.emailAlerts)
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

    async function onSubmit(values: ProfileFormValues) {
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
        <Card className="mx-auto w-full max-w-2xl border-border shadow-none">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage
                            src="/path-to-avatar-image.jpg"
                            alt="User avatar"
                        />
                        <AvatarFallback className="bg-muted font-display text-lg text-ink">
                            {form.getValues("username").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-display text-2xl font-semibold text-ink">
                            Edit profile
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Language preference applies to new daily assignments
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6"
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
                                        Used for account contact and alerts.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="preferredLanguageSlug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preferred language</FormLabel>
                                    <FormControl>
                                        <select
                                            title="Preferred language"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            {languages.map((language) => (
                                                <option
                                                    key={language.slug}
                                                    value={language.slug}
                                                >
                                                    {language.displayName}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormDescription>
                                        New daily challenges use this language.
                                        Today&apos;s assignment stays as-is.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="emailAlerts"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <input
                                                id="emailAlerts"
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.checked
                                                    )
                                                }
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                                className="h-4 w-4 rounded border-input accent-[var(--signal)]"
                                            />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor="emailAlerts"
                                            className="font-normal text-muted-foreground"
                                        >
                                            Receive email alerts for new
                                            challenges
                                        </FormLabel>
                                    </div>
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
                            className="w-full bg-signal text-white hover:bg-signal/90"
                        >
                            {isLoading ? "Saving…" : "Save changes"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
