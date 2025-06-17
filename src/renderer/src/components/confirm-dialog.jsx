import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'

const ConfirmDialog = forwardRef(({ }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [yesText, setYesText] = useState('Oui')
  const [noText, setNoText] = useState('Non')
  const onConfirmFunction = useRef(() => { })
  const onCancelFunction = useRef(() => { })

  useImperativeHandle(ref, () => ({
    show: ({
      title,
      message,
      onConfirm,
      onCancel,
      yesText = 'Oui',
      noText = 'Non',
    }) => {
      setTitle(title)
      setMessage(message)
      setYesText(yesText)
      setNoText(noText)
      onConfirmFunction.current = onConfirm
      onCancelFunction.current = onCancel
      setIsOpen(true)
    }
  }))

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-md">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelFunction.current}>{noText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmFunction.current} className="min-w-36 bg-red-600 hover:bg-red-700">
            {yesText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})

export default ConfirmDialog