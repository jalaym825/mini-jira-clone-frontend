import React, { useEffect, useState } from 'react';
import { PlusCircle, MoreVertical, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Tasks = ({socket}) => {
  const [tasks, setTasks] = useState({
    pending: [
      { id: 1, title: 'Research competitor products', description: 'Analyze top 3 competitors', priority: 'High' },
      { id: 2, title: 'Update documentation', description: 'Add new API endpoints', priority: 'Medium' },
    ],
    working: [
      { id: 3, title: 'Fix navigation bug', description: 'Mobile menu not closing', priority: 'High' },
    ],
    completed: [
      { id: 4, title: 'Design review', description: 'Review homepage mockups', priority: 'Low' },
    ],
  });


  useEffect(() => {
    socket.on('initial:state', (initialTasks) => {
      setTasks(initialTasks);
    });

    socket.on('task:move', (data) => {
      console.log(data)
      setTasks(prev => {
        const task = prev[data.sourceColumn].find(t => t.id === data.taskId);
        return {
          ...prev,
          [data.sourceColumn]: prev[data.sourceColumn].filter(t => t.id !== data.taskId),
          [data.targetColumn]: [...prev[data.targetColumn], task],
        };
      });
    });
    // Cleanup listeners on unmount
    return () => {
      socket.off('task:move');
      socket.off('initial:state');
    };
  }, [socket]);


  const handleDragStart = (e, taskId, sourceColumn) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceColumn', sourceColumn);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const sourceColumn = e.dataTransfer.getData('sourceColumn');

    if (sourceColumn === targetColumn) return;

    socket.emit('task:move', { taskId, sourceColumn, targetColumn });

    setTasks(prev => {
      const task = prev[sourceColumn].find(t => t.id === taskId);
      return {
        ...prev,
        [sourceColumn]: prev[sourceColumn].filter(t => t.id !== taskId),
        [targetColumn]: [...prev[targetColumn], task],
      };
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getColumnStyles = (status) => {
    switch (status) {
      case 'pending':
        return {
          container: 'bg-orange-50 border-t-4 border-orange-400',
          header: 'text-orange-700',
          icon: <Clock className="mr-2 text-orange-500" size={20} />,
          button: 'hover:bg-orange-100 text-orange-600 hover:text-orange-700',
          count: 'bg-orange-100 text-orange-600',
        };
      case 'working':
        return {
          container: 'bg-blue-50 border-t-4 border-blue-400',
          header: 'text-blue-700',
          icon: <Loader2 className="mr-2 text-blue-500" size={20} />,
          button: 'hover:bg-blue-100 text-blue-600 hover:text-blue-700',
          count: 'bg-blue-100 text-blue-600',
        };
      case 'completed':
        return {
          container: 'bg-green-50 border-t-4 border-green-400',
          header: 'text-green-700',
          icon: <CheckCircle2 className="mr-2 text-green-500" size={20} />,
          button: 'hover:bg-green-100 text-green-600 hover:text-green-700',
          count: 'bg-green-100 text-green-600',
        };
      default:
        return {
          container: 'bg-gray-50',
          header: 'text-gray-700',
          icon: null,
          button: 'hover:bg-gray-100',
          count: 'bg-gray-100 text-gray-600',
        };
    }
  };

  const Column = ({ title, tasks, status }) => {
    const styles = getColumnStyles(status);

    return (
      <div
        className={`flex flex-col w-96 rounded-lg p-4 ${styles.container}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {styles.icon}
            <h3 className={`font-semibold ${styles.header}`}>{title}</h3>
          </div>
          <span className={`rounded-full px-2 py-1 text-sm ${styles.count}`}>
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <Card
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id, status)}
              className="bg-white cursor-move hover:shadow-md transition-shadow"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <button className={`mt-4 flex items-center text-sm ${styles.button} rounded-md p-2`}>
          <PlusCircle size={16} className="mr-1" />
          Add task
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Project Tasks</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <PlusCircle size={16} className="mr-2" />
          New Task
        </button>
      </div>

      <div className="flex gap-16 justify-center ">
        <Column title="Pending" tasks={tasks.pending} status="pending" />
        <Column title="In Progress" tasks={tasks.working} status="working" />
        <Column title="Completed" tasks={tasks.completed} status="completed" />
      </div>
    </div>
  );
};

export default Tasks;