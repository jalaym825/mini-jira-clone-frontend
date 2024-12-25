import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { useParams } from 'react-router-dom';

const Component = ({ socket }) => {
    const { id } = useParams();
    const [text, setText] = useState('Click to start typing...');

    useEffect(() => {
        // Listen for initial text when joining room
        socket.on('initialText', (initialText) => {
            setText(initialText);
        });

        // Listen for text changes
        socket.on('textChange', (newText) => {
            setText(newText);
        });

        // Cleanup listeners on unmount
        return () => {
            socket.off('initialText');
            socket.off('textChange');
        };
    }, [socket]);

    const handleChange = (newText) => {
        setText(newText);
        socket.emit("textChange", { newText, roomId: id });
    }

    return (
        <div className='flex justify-center items-center h-screen'>
            <Card className="w-96">
                <CardContent className="p-6">
                    <Textarea
                        value={text}
                        onChange={(e) => handleChange(e.target.value)}
                        className="min-h-32 resize-none border-none focus-visible:ring-0 p-0"
                        placeholder="Type something..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default Component;