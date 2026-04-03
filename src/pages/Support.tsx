import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, HeadphonesIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Support() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !subject || !message) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        // Simulate sending an API request
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Your support request has been submitted successfully. IT support will contact you shortly.');
            setEmail('');
            setSubject('');
            setMessage('');

            // Navigate back after a short delay
            setTimeout(() => {
                navigate('/auth');
            }, 2000);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex bg-background">
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md space-y-8">

                    <div className="text-center animate-slide-up">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <HeadphonesIcon className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">IT Support</h1>
                        <p className="text-muted-foreground">
                            Need help? Fill out the form below and our IT support team will get back to you.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@brahmaputra.gov.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-foreground font-medium">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="Briefly describe your issue"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-foreground font-medium">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Provide more details about the problem you're experiencing..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                className="min-h-[120px] bg-background resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            className="w-full h-12"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Sending...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    Submit Request
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <Button
                            variant="ghost"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                            onClick={() => navigate('/auth')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
