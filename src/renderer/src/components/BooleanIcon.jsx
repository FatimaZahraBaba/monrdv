import React from "react"
import { CheckCircle2, XCircle } from "lucide-react"

function BooleanIcon({ value }) {
    return (
        value ?
            <CheckCircle2 size={20} className="text-green-600" /> :
            <XCircle size={20} className="text-orange-600" />
    )
}

export default BooleanIcon