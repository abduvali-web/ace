'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
    id: string
    content: string
    senderId: string
    senderName: string
    createdAt: string
}

interface ClientChatProps {
    isOpen: boolean
    onClose: () => void
}

export function ClientChat({ isOpen, onClose }: ClientChatProps) {
    const { data: session } = useSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isOpen && !isMinimized) {
            fetchMessages()
            // Poll for new messages every 3 seconds
            pollingRef.current = setInterval(fetchMessages, 3000)
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [isOpen, isMinimized])

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/client/chat')
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const handleSend = async () => {
        if (!newMessage.trim()) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/client/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })

            if (res.ok) {
                setNewMessage('')
                fetchMessages()
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    }

    if (!isOpen) return null

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-64' : 'w-96'}`}>
            <Card className="shadow-2xl border-primary/20">
                <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Mijozlar Chati
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <CardContent className="p-0">
                        {/* Messages Area */}
                        <ScrollArea className="h-80 p-4" ref={scrollAreaRef}>
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-sm">Hali xabarlar yo'q</p>
                                    <p className="text-xs">Birinchi bo'lib yozing!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => {
                                        const isOwnMessage = msg.senderId === session?.user?.id
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                                            >
                                                <Avatar className="w-8 h-8 flex-shrink-0">
                                                    <AvatarFallback className={`text-xs ${isOwnMessage ? 'bg-primary text-white' : 'bg-secondary'}`}>
                                                        {getInitials(msg.senderName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                                                    <div className={`text-xs text-muted-foreground mb-1 ${isOwnMessage ? 'text-right' : ''}`}>
                                                        {isOwnMessage ? 'Siz' : msg.senderName}
                                                    </div>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2 inline-block ${isOwnMessage
                                                                ? 'bg-primary text-white rounded-br-sm'
                                                                : 'bg-secondary rounded-bl-sm'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                    <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Xabar yozing..."
                                    className="flex-1"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={isLoading || !newMessage.trim()}
                                    size="icon"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
