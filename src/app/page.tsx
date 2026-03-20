"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Visualizer } from "@/components/Visualizer";
import { AddSubscriptionForm } from "@/components/AddSubscriptionForm";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Subscription } from "@/types/subscription";

export default function Home() {
    const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>(
        "subscriptions",
        [],
    );
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const totalBurn = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

    const handleAddSubscription = (newSub: Omit<Subscription, "id">) => {
        const subWithId: Subscription = {
            ...newSub,
            id: crypto.randomUUID(),
        };
        setSubscriptions([...subscriptions, subWithId]);
    };

    const handleDeleteSubscription = (id: string) => {
        setSubscriptions(subscriptions.filter((sub) => sub.id !== id));
    };

    if (!isClient) {
        return <div className="min-h-screen bg-black" />; // Hydration guard
    }

    return (
        <main className="relative min-h-screen bg-black overflow-hidden selection:bg-indigo-500/30">
            <Header totalBurn={totalBurn} />

            <Visualizer
                subscriptions={subscriptions}
                onDelete={handleDeleteSubscription}
            />

            <AddSubscriptionForm onAdd={handleAddSubscription} />
        </main>
    );
}
