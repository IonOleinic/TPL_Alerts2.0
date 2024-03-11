import PyPDF2
import os
import sys

def parse_pdf(pdf_path,all):
        if (pdf_path == None):
            raise Exception(
                f"[PARSE] File '{pdf_path}' not exist or was removed.")
        else:
            if os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    num_pages = len(pdf_reader.pages)
                    list_to_collect = []
                    for i in range(num_pages):
                        page = pdf_reader.pages[i]
                        text = page.extract_text()
                        lines = text.splitlines()
                        for i in range(10, len(lines)):
                            line = lines[i].split(' ')
                            if (len(line) > 30):
                                nume_TVM = " ".join(line[30:])
                                if ("Stefan" in nume_TVM):
                                    nume_TVM = "Colegiul Stefan cel Mare"
                                nr_bancnote = int(line[11])
                                if all=='yes' and not "Test" in nume_TVM:
                                    stoc = (nume_TVM, nr_bancnote)
                                    list_to_collect.append(stoc)
                                else:
                                    if (nr_bancnote > 399):
                                        stoc = (nume_TVM, nr_bancnote)
                                        list_to_collect.append(stoc)

                    if (len(list_to_collect) == 0):
                        print("Nu sunt TVM-uri de colectat.")
                    else:
                        whatsapp_text = ""
                        for stoc in list_to_collect:
                            nume_TVM, nr_bancnote=stoc
                            whatsapp_text += nume_TVM + \
                                " "+str(nr_bancnote)+"\n"
                        print(
                            f"TPL Suceava Stocuri Bancnote:\n{whatsapp_text}")
            else:
                raise Exception("PDF File Not Found.")

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    all=sys.argv[2]
    parse_pdf(pdf_path,all)