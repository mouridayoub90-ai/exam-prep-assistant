import os
import json
import base64
import urllib.request
import urllib.error

# Files to upload
FILES_TO_UPLOAD = [
    "index.html",
    "styles.css",
    "app.js",
    "nlp.js",
    "data.js",
    "package.json"
]

def upload_file_to_github(username, repo, token, filepath, file_content):
    url = f"https://api.github.com/repos/{username}/{repo}/contents/{filepath}"
    
    # Check if the file already exists on GitHub to retrieve its SHA (required for updates)
    sha = None
    check_req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        },
        method="GET"
    )
    try:
        with urllib.request.urlopen(check_req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            sha = res_data.get("sha")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f"⚠️ Warning checking existing {filepath}: HTTP {e.code}")
    except Exception as e:
        print(f"⚠️ Warning checking existing {filepath}: {e}")

    # Base64 encode the file content
    encoded_content = base64.b64encode(file_content.encode("utf-8")).decode("utf-8")
    
    data = {
        "message": f"Upload of {filepath} via API",
        "content": encoded_content
    }
    if sha:
        data["sha"] = sha
        data["message"] = f"Update of {filepath} via API"
        
    req_data = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        method="PUT"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            action = "updated" if sha else "uploaded"
            print(f"✅ Successfully {action}: {filepath}")
            return True
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        print(f"❌ Failed to upload {filepath}: HTTP {e.code} - {error_msg}")
        return False
    except Exception as e:
        print(f"❌ Error uploading {filepath}: {e}")
        return False

def create_github_repo(username, repo, token):
    url = "https://api.github.com/user/repos"
    data = {
        "name": repo,
        "description": "Assistant Intelligent de Préparation aux Examens (PFE)",
        "private": False
    }
    
    req_data = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"🎉 Created repository: https://github.com/{username}/{repo}")
            return True
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        # Code 422 usually means the repository already exists
        if e.code == 422 and "already exists" in error_msg:
            print(f"ℹ️ Repository '{repo}' already exists. We will upload files directly to it.")
            return True
        else:
            print(f"❌ Failed to create repository: HTTP {e.code} - {error_msg}")
            return False
    except Exception as e:
        print(f"❌ Error creating repository: {e}")
        return False

def main():
    print("====================================================")
    print("     GitHub Direct Uploader (PFE Exam Assistant)     ")
    print("====================================================")
    print("Ce script permet d'uploader directement votre projet sur GitHub")
    print("via l'API REST, sans nécessiter l'installation locale de Git.\n")
    
    username = input("Entrez votre nom d'utilisateur GitHub : ").strip()
    repo = input("Entrez le nom du dépôt à créer (ex: exam-prep-assistant) : ").strip()
    print("\nPour obtenir un jeton (Token) d'accès personnel :")
    print("1. Allez sur https://github.com/settings/tokens")
    print("2. Générez un nouveau token (Classic) avec la portée 'repo'.")
    token = input("Collez votre Jeton d'Accès Personnel GitHub (PAT) : ").strip()
    
    if not username or not repo or not token:
        print("\n❌ Erreur : Tous les champs sont requis.")
        return
        
    print("\n1. Tentative de création du dépôt sur GitHub...")
    if not create_github_repo(username, repo, token):
        print("❌ Impossible de continuer sans dépôt.")
        return
        
    print("\n2. Lecture et envoi des fichiers du projet...")
    project_dir = os.path.dirname(os.path.abspath(__file__))
    
    success_count = 0
    for filename in FILES_TO_UPLOAD:
        filepath = os.path.join(project_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                if upload_file_to_github(username, repo, token, filename, content):
                    success_count += 1
            except Exception as e:
                print(f"❌ Impossible de lire {filename}: {e}")
        else:
            print(f"⚠️ Fichier introuvable, sauté : {filename}")
            
    print(f"\n🚀 Téléchargement terminé ! {success_count}/{len(FILES_TO_UPLOAD)} fichiers envoyés.")
    if success_count == len(FILES_TO_UPLOAD):
        print(f"👉 Visitez votre dépôt : https://github.com/{username}/{repo}")

if __name__ == "__main__":
    main()
