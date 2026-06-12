import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireStaffOrAdmin } from '@/server/auth-context'
import { toActionErrorMessage } from '@/server/errors'
import { uploadPetPhotoToR2, deletePetPhotoFromR2 } from '@/server/storage-r2'
import { addPetPhoto, removePetPhoto } from '@/server/pets'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin()
    const { id: petId } = await params

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await uploadPetPhotoToR2(petId, buffer, file.type)
    await addPetPhoto(petId, url)

    revalidateTag('pets', 'max')
    revalidatePath(`/admin/pets/${petId}/edit`)
    revalidatePath(`/pets/${petId}`)

    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json({ error: toActionErrorMessage(error) }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireStaffOrAdmin()
    const { id: petId } = await params

    const body = (await request.json()) as { photoUrl?: string }
    if (!body.photoUrl) {
      return NextResponse.json({ error: 'photoUrl es requerido' }, { status: 400 })
    }

    await removePetPhoto(petId, body.photoUrl)
    await deletePetPhotoFromR2(body.photoUrl)

    revalidateTag('pets', 'max')
    revalidatePath(`/admin/pets/${petId}/edit`)
    revalidatePath(`/pets/${petId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: toActionErrorMessage(error) }, { status: 400 })
  }
}
