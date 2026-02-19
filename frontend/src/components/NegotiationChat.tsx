
"use client";

import { useState } from "react";
import { Send, Plus, MoreVertical, X, FileText, Lock, Paperclip } from "lucide-react";

interface Message {
    id: number;
    sender: string;
    content: string;
    timestamp: string;
    isOffer?: boolean;
    offerDetails?: {
        budget: string;
        timeline: string;
        termsHash: string;
    };
    attachments?: { name: string; size: string }[];
}

export default function NegotiationChat({ activeJobId, clientAddress, workerAddress }: { activeJobId?: string, clientAddress: string, workerAddress: string }) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: clientAddress, content: "Hi, I'm interested in your profile for my DeFi project.", timestamp: "10:00 AM" },
        { id: 2, sender: workerAddress, content: "Thanks! I have extensive experience with Solidity and React. What's the scope?", timestamp: "10:05 AM" }
    ]);
    const [newMessage, setNewMessage] = useState("");
    const [showTemplates, setShowTemplates] = useState(false);

    const templates = [
        "I can start immediately. My rate is 0.5 ETH/hr.",
        "Could you provide more details on the smart contract requirements?",
        "I propose a fixed price of 2 ETH for this milestone.",
        "Please review the attached proposal."
    ];

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // Check for "template" usage to simulate attachment
        let attachments = undefined;
        if (newMessage.includes("attached proposal")) {
            attachments = [{ name: "Proposal_v1.pdf", size: "2.4 MB" }];
        }

        const msg: Message = {
            id: messages.length + 1,
            sender: "Me", // Mock sender
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments
        };

        setMessages([...messages, msg]);
        setNewMessage("");
        setShowTemplates(false);
    };

    const useTemplate = (text: string) => {
        setNewMessage(text);
        setShowTemplates(false);
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Negotiation
                        <Lock className="w-3 h-3 text-green-600" />
                    </h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        End-to-End Encrypted
                    </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.map((msg) => {
                    const isMe = msg.sender === "Me";
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm"
                                }`}>
                                <p className="text-sm">{msg.content}</p>

                                {msg.attachments && (
                                    <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${isMe ? "bg-white/10" : "bg-gray-100 dark:bg-gray-600"
                                        }`}>
                                        <FileText className="w-4 h-4 opacity-70" />
                                        <span className="text-xs font-medium">{msg.attachments[0].name}</span>
                                        <span className="text-xs opacity-60">({msg.attachments[0].size})</span>
                                    </div>
                                )}

                                <span className={`text-[10px] block mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
                {showTemplates && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-10">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">Quick Replies</p>
                        {templates.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => useTemplate(t)}
                                className="w-full text-left text-sm px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 truncate"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Templates"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Attach File"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a secure message..."
                        className="flex-1 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
