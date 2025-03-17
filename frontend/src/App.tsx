import { ethers } from "ethers";
import React, { ReactElement, useEffect, useState, useCallback } from "react";
import getContract from "./utils/useGetContract";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { ipfsService } from "../services/ipfsService"; // Ensure this file exists and is correctly implemented
import { CandidateCard } from "./components/CandidateCard"; 
import { Box, Container, Grid, Stack, Typography } from "@mui/material";

// Définition du type pour un candidat
interface Candidate {
  id: number;
  name: string;
  totalVote: number;
  imageHash: string;
  candidateAddress: string;
}

// Adresse du contrat
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App(): ReactElement {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateFormData, setCandidateFormData] = useState({
    name: "",
    imageHash: "",
  });

  // Initialisation du contrat
  useEffect(() => {
    const contractInstance = getContract(CONTRACT_ADDRESS);
    if (contractInstance) {
      setContract(contractInstance);
      ipfsService.testAuthentication();
    }
  }, []);

  // Événements du contrat (évite les doublons en nettoyant les listeners)
  useEffect(() => {
    if (!contract) return;

    const handleCandidateCreated = async () => getAllCandidates();
    const handleVoted = async () => getAllCandidates();

    contract.on("candidateCreated", handleCandidateCreated);
    contract.on("Voted", handleVoted);

    return () => {
      contract.off("candidateCreated", handleCandidateCreated);
      contract.off("Voted", handleVoted);
    };
  }, [contract]);

  // Upload sur IPFS
  const IPFSUploadHandler = async (): Promise<string> => {
    if (!selectedImage) throw new Error("Aucune image sélectionnée");

    const resp = await ipfsService.pinFileToIPFS(selectedImage);
    if (!resp?.data?.IpfsHash) throw new Error("Erreur lors de l'upload IPFS");

    return `https://gateway.pinata.cloud/ipfs/${resp.data.IpfsHash}`;
  };

  // Enregistrer un candidat
  const registerCandidate = async () => {
    try {
      if (!contract) throw new Error("Contrat non chargé");

      const { name } = candidateFormData;
      if (!name) throw new Error("Le nom est requis");

      const ipfsImageHash = await IPFSUploadHandler();
      await contract.registerCandidate(name, ipfsImageHash);
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);
    }
  };

  // Voter pour un candidat
  const vote = useCallback(
    async (address: string) => {
      try {
        if (!contract) throw new Error("Contrat non chargé");
        if (!address) throw new Error("Adresse invalide");

        await contract.vote(address);
      } catch (error) {
        console.error("Erreur de vote :", error);
      }
    },
    [contract]
  );

  // Récupérer les candidats
  const getAllCandidates = useCallback(async () => {
    try {
      if (!contract) return;

      const retrievedCandidates = await contract.fetchCandidates();
      const formattedCandidates: Candidate[] = retrievedCandidates.map(
        (candidate: any) => ({
          id: candidate.id.toNumber(),
          name: candidate.name,
          totalVote: candidate.totalVote.toNumber(),
          imageHash: candidate.imageHash,
          candidateAddress: candidate.candidateAddress,
        })
      );
      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Erreur de récupération des candidats :", error);
    }
  }, [contract]);

  // Gestion du changement dans le formulaire
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCandidateFormData((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <>
      <Container maxWidth="md" sx={{ marginY: "2rem" }}>
        <Box component="form">
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <TextField
              id="filled-basic"
              label="Name"
              variant="filled"
              name="name"
              value={candidateFormData.name}
              onChange={handleChange}
            />
            <label htmlFor="contained-button-file">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSelectedImage(e.target.files ? e.target.files[0] : null)
                }
              />
            </label>
            <Button variant="contained" onClick={registerCandidate}>
              Register as Candidate
            </Button>
          </Stack>
        </Box>
      </Container>

      {candidates.length > 0 && (
        <Container sx={{ bgcolor: "#F0F3F7" }}>
          <Box sx={{ flexGrow: 1, paddingY: "3rem", paddingX: "2rem" }}>
            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {candidates.map((candidate, index) => (
                <Grid item sm={4} key={candidate.id || index}>
                  <CandidateCard candidate={candidate} vote={vote} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      )}
    </>
  );
}

export default App;
