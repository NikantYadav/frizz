
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import NegotiationChat from "@/components/NegotiationChat";
import { MessageSquare, User } from "lucide-react";

export default function MessagesPage() {
    const [selectedChat, setSelectedChat] = useState<number | null>(1);

    const chats = [
        { id: 1, name: "Alice Dev", job: "DeFi Frontend", lastMsg: "I sent the offer.", time: "2m ago" },
        { id: 2, name: "Bob Auditor", job: "Smart Contract Audit", lastMsg: "Checking the lines now...", time: "1h ago" }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full h-[calc(100vh-64px)]">
                <div className="flex h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat.id)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 ${selectedChat === chat.id ? "bg-blue-50 dark:bg-blue-900/10" : ""
                                        }`}
                                >
                                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="text-gray-500 w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{chat.name}</h3>
                                            <span className="text-xs text-gray-500">{chat.time}</span>
                                        </div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{chat.job}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.lastMsg}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
                        {selectedChat ? (
                            <div className="h-full flex flex-col p-4">
                                <NegotiationChat
                                    clientAddress="0xClient..."
                                    workerAddress="0xWorker..."
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                                <MessageSquare className="w-12 h-12 opacity-50" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
