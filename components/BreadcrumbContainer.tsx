import { SlashIcon } from "@radix-ui/react-icons"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import React from "react"

interface BreadcrumbItem {
    label: string
    href?: string
    isCurrent?: boolean
}

interface BreadcrumbContainerProps {
    items: BreadcrumbItem[]
}

export function BreadcrumbContainer({ items }: BreadcrumbContainerProps) {
    return (
        <Breadcrumb className="mb-4 rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2">
            <BreadcrumbList className="flex items-center space-x-1">
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem>
                            {item.isCurrent ? (
                                <BreadcrumbPage className="font-semibold text-gray-800 dark:text-gray-200">
                                    {item.label}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    href={item.href}
                                    className="text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    {item.label}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < items.length - 1 && (
                            <BreadcrumbSeparator className="text-gray-400 dark:text-gray-500">
                                <SlashIcon className="h-4 w-4" />
                            </BreadcrumbSeparator>
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
