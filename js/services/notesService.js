const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);



window.uploadNoteService = async function (
  file,
  metadata
) {

  const fileName = `${Date.now()}_${file.name}`;

  const { error } = await supabaseClient
    .storage
    .from("notes")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    return;
  }

  const { data } = supabaseClient
    .storage
    .from("notes")
    .getPublicUrl(fileName);

  await supabaseClient
    .from("notes_metadata")
    .insert([
      {
        student_class: metadata.student_class,
        subject: metadata.subject,
        topic: metadata.topic,
        url: data.publicUrl
      }
    ]);
};



window.searchNotesService = async function (
  search
) {

  const { data, error } = await supabaseClient
    .from("notes_metadata")
    .select("*")
    .ilike("topic", `%${search}%`);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};
