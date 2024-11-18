'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { PlusCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Choice = {
	id: string
	text: string
	votes: number
}

type Question = {
	id: string
	text: string
	choices: Choice[]
	channelId: string
}

type Channel = {
	id: string
	name: string
}

export function EnhancedAnonymousVotingAppComponent() {
	const [channels, setChannels] = useState<Channel[]>([])
	const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
	const [questions, setQuestions] = useState<Question[]>([])
	const [newChannel, setNewChannel] = useState('')
	const [newQuestion, setNewQuestion] = useState('')
	const [newChoices, setNewChoices] = useState<string[]>(['', ''])

	useEffect(() => {
		fetchChannels()
	}, [])

	useEffect(() => {
		if (selectedChannel) {
			fetchQuestions(selectedChannel)
		}
	}, [selectedChannel])

	async function fetchChannels() {
		const supabase = createClient()
		const { data, error } = await supabase.from('channels').select('*')
		if (error) {
			console.error('Error fetching channels:', error)
		} else {
			setChannels(data)
		}
	}

	async function fetchQuestions(channelId: string) {
		const supabase = createClient()
		const { data, error } = await supabase
			.from('questions')
			.select('*, choices(*)')
			.eq('channelId', channelId)
		if (error) {
			console.error('Error fetching questions:', error)
		} else {
			setQuestions(data)
		}
	}

	async function addChannel() {
		const supabase = createClient()
		if (newChannel.trim() !== '') {
			const { data, error } = await supabase
				.from('channels')
				.insert({ name: newChannel.trim() })
				.select()
			if (error) {
				console.error('Error adding channel:', error)
			} else {
				setChannels([...channels, data[0]])
				setNewChannel('')
			}
		}
	}

	async function addQuestion() {
		if (
			newQuestion.trim() !== '' &&
			newChoices.filter((choice) => choice.trim() !== '').length >= 2 &&
			selectedChannel
		) {
			const supabase = createClient()
			const { data: questionData, error: questionError } = await supabase
				.from('questions')
				.insert({ text: newQuestion.trim(), channelId: selectedChannel })
				.select()

			if (questionError) {
				console.error('Error adding question:', questionError)
				return
			}

			const choicesData = newChoices
				.filter((choice) => choice.trim() !== '')
				.map((choice) => ({
					text: choice.trim(),
					questionId: questionData[0].id,
					votes: 0,
				}))

			const { error: choicesError } = await supabase
				.from('choices')
				.insert(choicesData)

			if (choicesError) {
				console.error('Error adding choices:', choicesError)
				return
			}

			fetchQuestions(selectedChannel)
			setNewQuestion('')
			setNewChoices(['', ''])
		}
	}

	const addChoice = () => {
		setNewChoices([...newChoices, ''])
	}

	const removeChoice = (index: number) => {
		setNewChoices(newChoices.filter((_, i) => i !== index))
	}

	async function vote(questionId: string, choiceId: string) {
		const supabase = createClient()
		const { error } = await supabase.rpc('increment_vote', {
			choice_id: choiceId,
		})
		if (error) {
			console.error('Error voting:', error)
		} else {
			fetchQuestions(selectedChannel!)
		}
	}

	return (
		<div className="container mx-auto p-4 max-w-2xl">
			<h1 className="text-3xl font-bold mb-6 text-center">
				Enhanced Anonymous Voting App
			</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Create New Channel</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex space-x-2">
						<Input
							type="text"
							value={newChannel}
							onChange={(e) => setNewChannel(e.target.value)}
							placeholder="Enter channel name"
						/>
						<Button onClick={addChannel}>Create Channel</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Select Channel</CardTitle>
				</CardHeader>
				<CardContent>
					<Select
						onValueChange={setSelectedChannel}
						value={selectedChannel || undefined}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a channel" />
						</SelectTrigger>
						<SelectContent>
							{channels.map((channel) => (
								<SelectItem key={channel.id} value={channel.id}>
									{channel.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedChannel && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Add New Question</CardTitle>
					</CardHeader>
					<CardContent>
						<Input
							type="text"
							value={newQuestion}
							onChange={(e) => setNewQuestion(e.target.value)}
							placeholder="Enter your question"
							className="mb-4"
						/>
						{newChoices.map((choice, index) => (
							<div key={index} className="flex mb-2">
								<Input
									type="text"
									value={choice}
									onChange={(e) => {
										const updatedChoices = [...newChoices]
										updatedChoices[index] = e.target.value
										setNewChoices(updatedChoices)
									}}
									placeholder={`Choice ${index + 1}`}
									className="mr-2"
								/>
								{index >= 2 && (
									<Button
										variant="outline"
										size="icon"
										onClick={() => removeChoice(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						<Button onClick={addChoice} variant="outline" className="mb-4">
							<PlusCircle className="mr-2 h-4 w-4" /> Add Choice
						</Button>
						<Button onClick={addQuestion} className="w-full">
							Add Question
						</Button>
					</CardContent>
				</Card>
			)}

			{questions.map((question) => (
				<Card key={question.id} className="mb-4">
					<CardHeader>
						<CardTitle>{question.text}</CardTitle>
					</CardHeader>
					<CardContent>
						{question.choices.map((choice) => (
							<div
								key={choice.id}
								className="flex justify-between items-center mb-2"
							>
								<span>
									{choice.text} - Votes: {choice.votes}
								</span>
								<Button onClick={() => vote(question.id, choice.id)}>
									Vote
								</Button>
							</div>
						))}
					</CardContent>
				</Card>
			))}
		</div>
	)
}
